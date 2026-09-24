import prisma from './prisma';
import { sendTwilioSms } from './twilio';
import { sendTelnyxSms } from './telnyx';

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
  
  const provider = override?.provider || setting?.provider || (process.env.TELNYX_API_KEY ? 'telnyx' : 'twilio');
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
