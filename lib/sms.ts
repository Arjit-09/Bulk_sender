import prisma from './prisma';
import { sendTelnyxSms, inspectDestination, RouteInspection } from './telnyx';

export interface SmsDispatchResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  cost?: number;
  routedVia?: 'toll_free' | 'local' | 'telnyx';
  senderPhone?: string;
}

/**
 * Normalizes any phone number to E.164 format.
 * Auto-prefixes bare 10-digit US/CA numbers with +1.
 */
export function normalizePhone(rawPhone: string): {
  normalized: string;
  valid: boolean;
} {
  let clean = rawPhone.replace(/[\s()\-.]/g, '').trim();

  // Handle bare 10-digit North American numbers
  if (!clean.startsWith('+') && !clean.startsWith('00')) {
    if (/^[2-9]\d{9}$/.test(clean)) {
      clean = '+1' + clean;
    } else if (clean.startsWith('1') && clean.length === 11) {
      clean = '+' + clean;
    } else {
      clean = '+' + clean;
    }
  }

  if (clean.startsWith('+00')) {
    clean = '+' + clean.slice(3);
  }

  const valid = /^\+[1-9]\d{6,14}$/.test(clean);
  return { normalized: clean, valid };
}

/**
 * Dispatches an SMS via Telnyx Toll-Free or Local Route.
 */
export async function dispatchSms(
  toPhone: string,
  body: string,
  override?: {
    apiKey?: string;
    fromPhone?: string;
    routePreference?: 'toll_free' | 'local' | 'auto';
  }
): Promise<SmsDispatchResult> {
  const { normalized, valid } = normalizePhone(toPhone);

  if (!valid) {
    return {
      success: false,
      error: `Invalid phone number: "${toPhone}". Please use E.164 format (e.g. +14155552671 for US, +14165550143 for Canada).`,
    };
  }

  return await sendTelnyxSms(normalized, body, override);
}

export { inspectDestination };
export type { RouteInspection };
