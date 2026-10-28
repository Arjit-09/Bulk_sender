import { NextRequest, NextResponse } from 'next/server';
import { dispatchSms } from '@/lib/sms';
import { getSettings } from '@/lib/db-actions';

// Debug endpoint: POST /api/debug/test-send
// Body: { toPhone: "+1...", message: "test" }
export async function POST(req: NextRequest) {
  try {
    const { toPhone, message } = await req.json();
    if (!toPhone) {
      return NextResponse.json({ error: 'toPhone required' }, { status: 400 });
    }

    const setting = await getSettings();
    const result = await dispatchSms(toPhone, message || 'Test from debug endpoint');

    return NextResponse.json({
      result,
      provider: setting?.provider,
      hasApiKey: Boolean((setting as any)?.authToken?.startsWith('KEY') || process.env.TELNYX_API_KEY),
      fromPhone: (setting as any)?.fromPhone || process.env.TELNYX_PHONE_NUMBER,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
