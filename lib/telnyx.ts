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
      error: 'Missing Telnyx API Key. Please paste your Telnyx API Key into Settings and click "Save Configuration".',
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

  const isUSNumber = toPhone.startsWith('+1') && toPhone.length === 12;
  const isIndianNumber = toPhone.startsWith('+91');

  try {
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromPhone.trim(),
        to: toPhone.trim(),
        text: body,
        // Add webhook URL for delivery receipts if configured
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? { webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telnyx` }
          : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telnyx API Error:', JSON.stringify(data));
      const errorCode = String(data?.errors?.[0]?.code || '');
      const rawDetail = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || `Telnyx HTTP ${response.status}`;

      let errDetail = rawDetail;

      // US A2P 10DLC registration errors
      if (
        isUSNumber &&
        (errorCode === '40300' || errorCode === '40301' || errorCode === '40302' ||
         errorCode === '40303' || errorCode === '40304' || errorCode === '40305' ||
         rawDetail.toLowerCase().includes('10dlc') ||
         rawDetail.toLowerCase().includes('campaign') ||
         rawDetail.toLowerCase().includes('brand') ||
         rawDetail.toLowerCase().includes('unregistered') ||
         rawDetail.toLowerCase().includes('carrier') ||
         response.status === 422)
      ) {
        errDetail = `US A2P 10DLC Required: Your Telnyx number (+14795909259) needs A2P 10DLC brand & campaign registration to send SMS to US numbers (+1). Steps: (1) Go to portal.telnyx.com → Messaging → 10DLC Registration, (2) Register your Brand ($4), (3) Register a Campaign (~$10/month), (4) Assign your number to the campaign. Indian (+91) numbers work without this.`;
      }
      // Indian DLT errors (sending TO India fails without DLT)
      else if (isIndianNumber && (errorCode === '40306' || rawDetail.toLowerCase().includes('dlt'))) {
        errDetail = `Indian DLT Registration Required: To send FROM a US number TO Indian (+91) numbers, you need TRAI DLT approval. However, Indian numbers can receive international SMS from some carriers. The message may still be delivered depending on the recipient's carrier.`;
      }

      return {
        success: false,
        error: errDetail,
      };
    }

    const messageData = data?.data;
    // Telnyx returns per-recipient status in to[0].status — e.g. "queued", "sent", "delivered"
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

// Fetch inbound messages from Telnyx API (poll-based fallback when webhook not configured)
export async function fetchTelnyxInboundMessages() {
  const setting = await prisma.setting.findFirst();
  let apiKey = (setting?.authToken?.startsWith('KEY') ? setting.authToken : '') ||
    process.env.TELNYX_API_KEY || '';

  const keyMatch = apiKey.match(/KEY[0-9A-Za-z_-]+/);
  if (keyMatch) apiKey = keyMatch[0];

  if (!apiKey) return { count: 0 };

  try {
    // Telnyx API: GET /v2/messages?direction=inbound
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
      console.error('Telnyx inbound fetch error:', response.status);
      return { count: 0 };
    }

    const data = await response.json();
    const messages = data?.data || [];
    let imported = 0;

    for (const m of messages) {
      if (m.direction !== 'inbound') continue;

      const existing = await prisma.message.findFirst({
        where: { providerSid: m.id },
      });
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
