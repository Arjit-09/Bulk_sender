import prisma from './prisma';
import { sendTelnyxSms } from './telnyx';

export interface SmsDispatchResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  cost?: number;
  routedVia?: 'telnyx';
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

  // Accept any valid E.164 number (let Telnyx decide if it can deliver)
  const valid = /^\+[1-9]\d{6,14}$/.test(clean);
  return { normalized: clean, valid };
}

/**
 * Dispatches an SMS via Telnyx Toll-Free (+18884020949).
 * Attempts delivery to any valid E.164 number — Telnyx will return
 * an error if the destination carrier rejects the international route.
 */
export async function dispatchSms(
  toPhone: string,
  body: string,
  override?: { apiKey?: string; fromPhone?: string }
): Promise<SmsDispatchResult> {
  const { normalized, valid } = normalizePhone(toPhone);

  if (!valid) {
    return {
      success: false,
      error: `Invalid phone number: "${toPhone}". Please use E.164 format (e.g. +14155552671 for US, +918920856958 for India).`,
      routedVia: 'telnyx',
    };
  }

  const res = await sendTelnyxSms(normalized, body, override);
  return {
    ...res,
    routedVia: 'telnyx',
  };
}
