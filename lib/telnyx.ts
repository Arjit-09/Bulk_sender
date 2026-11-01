import prisma from './prisma';

interface TelnyxSendResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  cost?: number;
  routedVia?: 'toll_free' | 'local';
  senderPhone?: string;
}

export interface RouteInspection {
  destination: string;
  isUSOrCanada: boolean;
  isVirtualVoIP: boolean;
  suggestedRoute: 'toll_free' | 'local';
  suggestedSender: string;
  carrierLabel: string;
}

/**
 * Inspects a destination phone number to determine carrier classification
 * and optimal Telnyx route between Toll-Free (+1888) and Local (+1479).
 */
export function inspectDestination(toPhone: string): RouteInspection {
  const clean = toPhone.replace(/[\s()\-.]/g, '');
  const digits = clean.startsWith('+') ? clean.slice(1) : clean;

  const isUSOrCanada = digits.startsWith('1') && digits.length === 11;

  // Known VoIP virtual prefixes and test numbers (TextNow, Google Voice, Onvoy, Bandwidth)
  const isVirtualVoIP =
    digits.includes('2393753770') ||
    digits.includes('2393751625') ||
    digits.includes('8046341990') ||
    digits.startsWith('1239375');

  const TOLL_FREE = process.env.TELNYX_PHONE_NUMBER || '+18884020949';
  const LOCAL_10DLC = process.env.TELNYX_LOCAL_NUMBER || '+14795909259';

  let suggestedRoute: 'toll_free' | 'local' = 'toll_free';
  let suggestedSender = TOLL_FREE;
  let carrierLabel = 'US/Canada Physical Mobile (Toll-Free Route)';

  if (isVirtualVoIP) {
    suggestedRoute = 'local';
    suggestedSender = LOCAL_10DLC;
    carrierLabel = 'US Virtual VoIP (Local 10DLC Route)';
  } else if (!isUSOrCanada) {
    suggestedRoute = 'local';
    suggestedSender = LOCAL_10DLC;
    carrierLabel = 'Specialized / Non-NANP (Local Route)';
  } else {
    // Standard US / Canada physical mobile
    suggestedRoute = 'toll_free';
    suggestedSender = TOLL_FREE;
    carrierLabel = 'US/Canada Mobile Carrier (High-Throughput Toll-Free)';
  }

  return {
    destination: clean.startsWith('+') ? clean : '+' + clean,
    isUSOrCanada,
    isVirtualVoIP,
    suggestedRoute,
    suggestedSender,
    carrierLabel,
  };
}

export async function sendTelnyxSms(
  toPhone: string,
  body: string,
  override?: {
    apiKey?: string;
    fromPhone?: string;
    routePreference?: 'toll_free' | 'local' | 'auto';
  }
): Promise<TelnyxSendResult> {
  const setting = await prisma.setting.findFirst();

  const TOLL_FREE = process.env.TELNYX_PHONE_NUMBER || setting?.tollFreeNumber || '+18884020949';
  const LOCAL_10DLC = process.env.TELNYX_LOCAL_NUMBER || setting?.localNumber || '+14795909259';

  const TOLL_FREE_PROFILE =
    process.env.TELNYX_MESSAGING_PROFILE_ID ||
    setting?.tollFreeProfileId ||
    '4001a0fd-9be4-4b36-a8ef-7dfd7462992b';

  const LOCAL_PROFILE =
    process.env.TELNYX_LOCAL_MESSAGING_PROFILE_ID ||
    setting?.localProfileId ||
    '4001a0c9-9e1c-444e-ad71-a18b1bdeb2da';

  const TOLL_FREE_KEY =
    process.env.TELNYX_API_KEY ||
    setting?.tollFreeApiKey ||
    setting?.authToken ||
    '';

  const LOCAL_KEY =
    process.env.TELNYX_LOCAL_API_KEY ||
    setting?.localApiKey ||
    setting?.accountSid ||
    '';

  // Determine Sender & Route
  const inspection = inspectDestination(toPhone);
  let chosenSender = override?.fromPhone?.trim();
  let chosenRoute: 'toll_free' | 'local' = inspection.suggestedRoute;

  if (override?.routePreference === 'toll_free') {
    chosenRoute = 'toll_free';
    chosenSender = TOLL_FREE;
  } else if (override?.routePreference === 'local') {
    chosenRoute = 'local';
    chosenSender = LOCAL_10DLC;
  } else if (!chosenSender) {
    chosenRoute = inspection.suggestedRoute;
    chosenSender = inspection.suggestedSender;
  } else {
    chosenRoute = (chosenSender.includes('479') || chosenSender === LOCAL_10DLC) ? 'local' : 'toll_free';
  }

  // Select matching API Key and Messaging Profile
  let activeApiKey = override?.apiKey?.trim() || '';
  let activeProfile = TOLL_FREE_PROFILE;

  if (chosenRoute === 'local') {
    activeApiKey = activeApiKey || LOCAL_KEY || TOLL_FREE_KEY;
    activeProfile = LOCAL_PROFILE;
  } else {
    activeApiKey = activeApiKey || TOLL_FREE_KEY;
    activeProfile = TOLL_FREE_PROFILE;
  }

  // Sanitize API Key
  const keyMatch = activeApiKey.match(/KEY[0-9A-Za-z_-]+/);
  if (keyMatch) {
    activeApiKey = keyMatch[0];
  }

  if (!activeApiKey) {
    return {
      success: false,
      error: `Missing Telnyx API Key for ${chosenRoute === 'local' ? 'Local' : 'Toll-Free'} route. Please configure your Telnyx keys in Settings.`,
    };
  }

  try {
    const cleanFrom = chosenSender.replace(/[\s()-]/g, '').trim();
    let cleanTo = toPhone.replace(/[\s()-]/g, '').trim();
    if (!cleanTo.startsWith('+')) {
      cleanTo = '+' + cleanTo;
    }

    const requestBody: Record<string, string> = {
      from: cleanFrom.startsWith('+') ? cleanFrom : '+' + cleanFrom,
      to: cleanTo,
      text: body,
    };

    if (activeProfile) {
      requestBody.messaging_profile_id = activeProfile;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zenithtech.site';
    requestBody.webhook_url = `${appUrl}/api/webhooks/telnyx`;

    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telnyx Dispatch Error:', JSON.stringify(data));
      const errorCode = String(data?.errors?.[0]?.code || '');
      const rawDetail = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || '';

      let errDetail = rawDetail || `Telnyx error (HTTP ${response.status})`;

      if (errorCode === '10010') {
        errDetail = `Authorization error: Sender ${cleanFrom} belongs to Telnyx account 2. Ensure TELNYX_LOCAL_API_KEY is configured.`;
      } else if (errorCode === '40306') {
        errDetail = `Destination restriction: The recipient carrier rejected delivery via ${chosenRoute} sender. Try switching to ${chosenRoute === 'toll_free' ? 'Local' : 'Toll-Free'} route.`;
      }

      return {
        success: false,
        error: errDetail,
        routedVia: chosenRoute,
        senderPhone: chosenSender,
      };
    }

    const messageData = data?.data;
    const recipientStatus = messageData?.to?.[0]?.status || 'queued';
    const messageId = messageData?.id;
    const resolvedStatus = recipientStatus === 'queued' ? 'sent' : recipientStatus;

    return {
      success: true,
      sid: messageId,
      status: resolvedStatus,
      cost: parseFloat(messageData?.cost?.amount || '0.0075'),
      routedVia: chosenRoute,
      senderPhone: chosenSender,
    };
  } catch (err: unknown) {
    console.error('Telnyx Network Error:', err);
    return {
      success: false,
      error: (err as Error)?.message || 'Failed to dispatch via Telnyx API',
      routedVia: chosenRoute,
      senderPhone: chosenSender,
    };
  }
}

/**
 * Polls inbound messages from both Telnyx Accounts (Toll-Free and Local)
 * to ensure two-way synchronization in the inbox.
 */
export async function fetchTelnyxInboundMessages() {
  const setting = await prisma.setting.findFirst();

  const tollFreeKey = process.env.TELNYX_API_KEY || setting?.tollFreeApiKey || setting?.authToken || '';
  const localKey = process.env.TELNYX_LOCAL_API_KEY || setting?.localApiKey || setting?.accountSid || '';

  const keysToSync = Array.from(new Set([tollFreeKey, localKey])).filter(
    (k) => Boolean(k) && k.startsWith('KEY')
  );

  let totalImported = 0;

  for (const rawKey of keysToSync) {
    const keyMatch = rawKey.match(/KEY[0-9A-Za-z_-]+/);
    const apiKey = keyMatch ? keyMatch[0] : rawKey;

    try {
      const response = await fetch(
        'https://api.telnyx.com/v2/messages?direction=inbound&page[size]=50',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const messages = data?.data || [];

      for (const m of messages) {
        if (m.direction !== 'inbound') continue;

        const existing = await prisma.message.findFirst({ where: { providerSid: m.id } });
        if (existing) continue;

        const fromPhone = m.from?.phone_number || m.from || '';
        const toPhone = m.to?.[0]?.phone_number || m.to || '';
        const content = m.text || '';

        if (!fromPhone || !content) continue;

        let contact = await prisma.contact.findFirst({ where: { phone: fromPhone } });
        if (!contact) {
          const isCA = fromPhone.startsWith('+1416') || fromPhone.startsWith('+1514') || fromPhone.startsWith('+1604');
          contact = await prisma.contact.create({
            data: {
              name: `Contact (${fromPhone.slice(-4)})`,
              phone: fromPhone,
              country: isCA ? 'CA' : 'US',
              status: 'active',
            },
          });
        }

        const senderRoute = toPhone.includes('479') ? 'local' : 'toll_free';

        await prisma.message.create({
          data: {
            contactId: contact.id,
            channel: 'sms',
            senderRoute,
            direction: 'inbound',
            toPhone,
            fromPhone,
            content: content.trim(),
            status: 'delivered',
            cost: 0,
            providerSid: m.id,
            sentAt: new Date(m.received_at || m.created_at || Date.now()),
          },
        });

        totalImported++;
      }
    } catch (err) {
      console.error('Telnyx inbound sync error for key:', err);
    }
  }

  return { count: totalImported };
}
