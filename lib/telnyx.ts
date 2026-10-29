import prisma from './prisma';

interface TelnyxSendResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  cost?: number;
}

export async function sendTelnyxSms(
  toPhone: string, 
  body: string,
  override?: { apiKey?: string; fromPhone?: string }
): Promise<TelnyxSendResult> {
  const setting = await prisma.setting.findFirst();

  let apiKey = override?.apiKey?.trim() || '';
  if (!apiKey || apiKey.includes('xxxx') || !apiKey.startsWith('KEY')) {
    if (setting?.authToken && setting.authToken.startsWith('KEY') && !setting.authToken.includes('xxxx')) {
      apiKey = setting.authToken.trim();
    } else {
      apiKey = process.env.TELNYX_API_KEY?.trim() || '';
    }
  }

  let fromPhone = override?.fromPhone?.trim() || setting?.fromPhone?.trim() || '';

  // ── Smart Sender Routing ────────────────────────────────────────────
  // Toll-Free (+18884020949) = best for US/Canada (verified, high throughput)
  // Local 10DLC (+14795909259) = needed for international (India, etc.)
  //   because US toll-free numbers are contractually limited to US+Canada.
  const cleanDest = toPhone.replace(/[\s()\.\-]/g, '');
  const isInternational = !cleanDest.startsWith('+1') && !/^[2-9]\d{9}$/.test(cleanDest);

  const TOLL_FREE   = process.env.TELNYX_PHONE_NUMBER || '+18884020949';
  const LOCAL_10DLC = process.env.TELNYX_LOCAL_NUMBER || '+14795909259';
  const TOLL_FREE_PROFILE  = process.env.TELNYX_MESSAGING_PROFILE_ID || '4001a0fd-9be4-4b36-a8ef-7dfd7462992b';
  // The local number is on the BULK_SMS_APP profile — update env if different
  const LOCAL_PROFILE = process.env.TELNYX_LOCAL_MESSAGING_PROFILE_ID || TOLL_FREE_PROFILE;

  if (!fromPhone) {
    fromPhone = isInternational ? LOCAL_10DLC : TOLL_FREE;
    // Also override if user left the setting as toll-free but dest is international
  } else if (isInternational && (fromPhone.includes('888') || fromPhone.startsWith('+1888'))) {
    fromPhone = LOCAL_10DLC;
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'Missing Telnyx API Key. Please enter your Telnyx API Key in Settings and click "Save Configuration".',
    };
  }

  if (!fromPhone) {
    return {
      success: false,
      error: 'Missing Telnyx sender phone number. Please add your Telnyx number in Settings.',
    };
  }

  // Extract pure KEY... token in case user pasted surrounding text
  const keyMatch = apiKey.match(/KEY[0-9A-Za-z_-]+/);
  if (keyMatch) {
    apiKey = keyMatch[0];
  }

  try {
    // Normalize phone numbers: strip spaces, parentheses, dashes
    const cleanFrom = fromPhone.replace(/[\s()-]/g, '').trim();
    let cleanTo = toPhone.replace(/[\s()-]/g, '').trim();
    if (!cleanTo.startsWith('+')) {
      cleanTo = '+' + cleanTo;
    }

    // Select the correct messaging profile to match the chosen sender number
    const messagingProfileId = isInternational ? LOCAL_PROFILE : TOLL_FREE_PROFILE;


    const requestBody: Record<string, string> = {
      from: cleanFrom.startsWith('+') ? cleanFrom : '+' + cleanFrom,
      to: cleanTo,
      text: body,
      messaging_profile_id: messagingProfileId,
    };

    // Ensure webhook URL is always provided for real-time delivery status and receipts
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telnyx`
      : 'https://www.zenithtech.site/api/webhooks/telnyx';
    requestBody.webhook_url = webhookUrl;

    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telnyx API Error:', JSON.stringify(data));
      
      const errorCode = String(data?.errors?.[0]?.code || '');
      const rawDetail = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || '';
      const rawMeta = JSON.stringify(data?.errors?.[0]?.meta || {});

      let errDetail = rawDetail || `Telnyx error (HTTP ${response.status})`;

      if (errorCode === '40306') {
        if (cleanTo.startsWith('+91')) {
          errDetail = 'Destination restriction: Telnyx US Toll-Free (+1888...) cannot deliver to India (+91) due to Indian TRAI telecom regulations requiring domestic DLT alphanumeric sender IDs. Your toll-free number is authorized for US & Canada.';
        } else {
          errDetail = `Telnyx error 40306: Destination cannot be reached via this sender. Please verify the destination is a valid US (+1) or Canadian number.`;
        }
      } else if (errorCode === '40009') {
        errDetail = `Telnyx error 40009: Your Telnyx number is not enabled for SMS or the messaging profile is not attached. Go to portal.telnyx.com → Phone Numbers → your number → Messaging Profile.`;
      } else if (errorCode === '40002') {
        errDetail = `Telnyx error 40002: Invalid sender. Make sure your Telnyx number (${fromPhone}) is assigned to a Messaging Profile in Telnyx Portal.`;
      } else if (errorCode === '10001' || errorCode === '10002') {
        errDetail = `Telnyx auth error: Invalid API key. Please re-enter your Telnyx API key in Settings.`;
      } else if (rawMeta && rawMeta !== '{}') {
        errDetail = `${errDetail} (Code: ${errorCode}, Details: ${rawMeta})`;
      }

      return {
        success: false,
        error: errDetail,
      };
    }

    const messageData = data?.data;
    const recipientStatus = messageData?.to?.[0]?.status || 'queued';
    const messageId = messageData?.id;

    // Telnyx returns initial status as 'queued' which delivers within 1-2 seconds.
    // Map to 'sent' so the message doesn't appear stuck in queue in the UI.
    const resolvedStatus = recipientStatus === 'queued' ? 'sent' : recipientStatus;

    return {
      success: true,
      sid: messageId,
      status: resolvedStatus,
      cost: parseFloat(messageData?.cost?.amount || '0.0075'),
    };
  } catch (err: unknown) {
    console.error('Telnyx Network Error:', err);
    return {
      success: false,
      error: (err as Error)?.message || 'Failed to connect to Telnyx API',
    };
  }
}

// Poll Telnyx API for inbound messages (fallback when webhook not set up)
export async function fetchTelnyxInboundMessages() {
  const setting = await prisma.setting.findFirst();
  let apiKey = (setting?.provider === 'telnyx' && setting?.authToken?.startsWith('KEY') ? setting.authToken : '') ||
    process.env.TELNYX_API_KEY || '';

  const keyMatch = apiKey.match(/KEY[0-9A-Za-z_-]+/);
  if (keyMatch) apiKey = keyMatch[0];

  if (!apiKey) return { count: 0 };

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

    if (!response.ok) {
      console.error('Telnyx inbound fetch error:', response.status, await response.text());
      return { count: 0 };
    }

    const data = await response.json();
    const messages = data?.data || [];
    let imported = 0;

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
        contact = await prisma.contact.create({
          data: {
            name: `Contact (${fromPhone.slice(-4)})`,
            phone: fromPhone,
            status: 'active',
          },
        });
      }

      await prisma.message.create({
        data: {
          contactId: contact.id,
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
      imported++;
    }

    return { count: imported };
  } catch (err) {
    console.error('Telnyx inbound sync error:', err);
    return { count: 0 };
  }
}
