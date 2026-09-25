import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Twilio calls this URL with delivery status updates (delivered, failed, undelivered, etc.)
// Configure this in Twilio Console → Phone Numbers → Active Numbers → Status Callback URL
// URL: https://your-app.vercel.app/api/webhooks/twilio/status
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const messageSid = formData.get('MessageSid')?.toString() || '';
    const messageStatus = formData.get('MessageStatus')?.toString() || ''; // delivered, failed, undelivered, sent, etc.
    const errorCode = formData.get('ErrorCode')?.toString() || '';

    if (!messageSid || !messageStatus) {
      return new NextResponse('', { status: 200 });
    }

    // Update message status in DB by provider SID
    await prisma.message.updateMany({
      where: { providerSid: messageSid },
      data: {
        status: messageStatus === 'undelivered' ? 'failed' : messageStatus,
      },
    });

    console.log(`[Twilio Status] SID=${messageSid} → ${messageStatus}${errorCode ? ` (error: ${errorCode})` : ''}`);
    return new NextResponse('', { status: 200 });
  } catch (error: any) {
    console.error('Twilio Status Webhook Error:', error);
    return new NextResponse('', { status: 500 });
  }
}
