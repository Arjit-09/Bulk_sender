import prisma from './prisma';
import { sendTwilioSms } from './twilio';
import { sendTelnyxSms } from './telnyx';
import { sendFast2Sms } from './fast2sms';

export interface SmsDispatchResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  cost?: number;
}

export async function dispatchSms(
  toPhone: string, 
  body: string,
  override?: { apiKey?: string; fromPhone?: string; provider?: string }
): Promise<SmsDispatchResult> {
  const setting = await prisma.setting.findFirst();
  
  const provider = override?.provider || setting?.provider || process.env.SMS_PROVIDER || 'fast2sms';

  // Fast2SMS priority for Indian SMS (+91)
  if (provider === 'fast2sms' || (!override?.provider && process.env.FAST2SMS_API_KEY)) {
    const res = await sendFast2Sms(toPhone, body, override?.apiKey);
    return {
      success: res.success,
      sid: res.messageId,
      status: res.status,
      error: res.error,
      cost: 0.15,
    };
  }

  const isTelnyx = 
    provider === 'telnyx' || 
    Boolean(override?.apiKey?.startsWith('KEY')) ||
    Boolean(process.env.TELNYX_API_KEY) || 
    Boolean(setting?.authToken?.startsWith('KEY'));

  if (isTelnyx) {
    return await sendTelnyxSms(toPhone, body, override);
  }

  return await sendTwilioSms(toPhone, body);
}

