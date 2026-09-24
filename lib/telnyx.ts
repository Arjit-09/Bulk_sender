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
    '+14795909259';

  if (!apiKey) {
    return {
      success: false,
      error: 'Missing Telnyx API Key. Please paste your Telnyx API Key into the form and click "Save Configuration".',
    };
  }

  // Extract pure KEY... token in case user pasted surrounding text or timestamp
  const keyMatch = apiKey.match(/KEY[0-9A-Za-z_-]+/);
  if (keyMatch) {
    apiKey = keyMatch[0];
  }

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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telnyx API Error:', data);
      let errDetail = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || `Telnyx HTTP ${response.status}`;
      
      const errorCode = String(data?.errors?.[0]?.code || '');
      if (errorCode === '40306' || toPhone.startsWith('+91')) {
        errDetail = 'Indian Carrier Regulation (TRAI DLT): Indian telecom regulations (+91) strictly require enterprise DLT registration & an approved Indian sender header. US numbers (+1...) cannot send directly to Indian numbers without DLT approval. Test with any US (+1) number to see live delivery!';
      }

      return {
        success: false,
        error: errDetail,
      };
    }

    const messageData = data?.data;
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
