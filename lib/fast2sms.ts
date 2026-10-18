export interface Fast2SmsResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export async function sendFast2Sms(
  toPhone: string,
  message: string,
  overrideApiKey?: string
): Promise<Fast2SmsResult> {
  const apiKey =
    overrideApiKey ||
    process.env.FAST2SMS_API_KEY ||
    'Wq7mxE18PfMXJp4G6z2SjQNHZIT3VFcolLRKUnykYri0aCsdObE2kjei6qu1nYITBZlG7f5WcwQSo3bP';

  if (!apiKey) {
    return {
      success: false,
      error: 'Missing Fast2SMS API Key. Please add your key in Settings.',
    };
  }

  // Normalize Indian phone number: strip spaces, dashes, +91, 91 prefix
  // Fast2SMS requires 10-digit Indian mobile numbers
  let cleanNumber = toPhone.replace(/[\s()-]/g, '').trim();
  if (cleanNumber.startsWith('+91')) {
    cleanNumber = cleanNumber.slice(3);
  } else if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    cleanNumber = cleanNumber.slice(2);
  }

  if (cleanNumber.length !== 10) {
    return {
      success: false,
      error: `Invalid Indian phone number: ${toPhone}. Fast2SMS requires a valid 10-digit mobile number.`,
    };
  }

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q', // Quick SMS route (No DLT required)
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanNumber,
      }),
    });

    const data = await response.json();

    if (data.return === true || data.status_code === 200) {
      return {
        success: true,
        messageId: data.request_id || `f2s_${Date.now()}`,
        status: 'delivered',
      };
    } else {
      return {
        success: false,
        error: data.message || (Array.isArray(data.message) ? data.message[0] : 'Fast2SMS dispatch failed'),
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error calling Fast2SMS API',
    };
  }
}
