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
  if (!apiKey) {
    if (setting?.authToken && (setting.provider === 'telnyx' || setting.authToken.startsWith('KEY'))) {
      apiKey = setting.authToken.trim();
    } else {
      apiKey = process.env.TELNYX_API_KEY?.trim() || '';
    }
  }

  const fromPhone = 
    override?.fromPhone?.trim() || 
    setting?.fromPhone?.trim() || 
    process.env.TELNYX_PHONE_NUMBER?.trim() || 
    '';

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

    const requestBody: Record<string, string> = {
      from: cleanFrom.startsWith('+') ? cleanFrom : '+' + cleanFrom,
      to: cleanTo,
      text: body,
    };

    // Add webhook for delivery receipts only if app URL is configured
    if (process.env.NEXT_PUBLIC_APP_URL) {
      requestBody.webhook_url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telnyx`;
    }

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
      // Always log the full error for debugging
      console.error('Telnyx API Error:', JSON.stringify(data));
      
      const errorCode = String(data?.errors?.[0]?.code || '');
      const rawDetail = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || '';
      const rawMeta = JSON.stringify(data?.errors?.[0]?.meta || {});

      // Show the ACTUAL Telnyx error to the user — don't guess
      let errDetail = rawDetail || `Telnyx error (HTTP ${response.status})`;

      // Only add helpful context for known specific error codes
      if (errorCode === '40306') {
        errDetail = `Telnyx error 40306: ${rawDetail || 'Destination number cannot be reached'}.`;
      } else if (errorCode === '40009') {
        errDetail = `Telnyx error 40009: Your Telnyx number is not enabled for SMS or the messaging profile is not attached. Go to portal.telnyx.com → Phone Numbers → your number → Messaging Profile.`;
      } else if (errorCode === '40002') {
        errDetail = `Telnyx error 40002: Invalid sender. Make sure your Telnyx number (${fromPhone}) is assigned to a Messaging Profile in Telnyx Portal.`;
      } else if (errorCode === '10001' || errorCode === '10002') {
        errDetail = `Telnyx auth error: Invalid API key. Please re-enter your Telnyx API key in Settings.`;
      } else if (rawMeta) {
        // Include any additional meta info from Telnyx
        errDetail = `${errDetail} (Code: ${errorCode}${rawMeta !== '{}' ? ', Details: ' + rawMeta : ''})`;
      }

      return {
        success: false,
        error: errDetail,
      };
    }

    const messageData = data?.data;
    // Telnyx returns per-recipient status: queued, sent, delivered, failed
    const recipientStatus = messageData?.to?.[0]?.status || 'queued';
    const messageId = messageData?.id;

    return {
      success: true,
      sid: messageId,
      status: recipientStatus,
      cost: parseFloat(messageData?.cost?.amount || '0.004'),
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
