import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.data?.event_type;
    const payload = body?.data?.payload;

    // ── Inbound SMS received ──────────────────────────────────────────
    if (eventType === 'message.received') {
      const fromPhone = payload?.from?.phone_number || '';
      const toPhone = payload?.to?.[0]?.phone_number || '';
      const content = payload?.text || '';
      const messageId = payload?.id || '';

      if (fromPhone && content) {
        // Deduplicate
        const existing = await prisma.message.findFirst({ where: { providerSid: messageId } });
        if (!existing) {
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
              cost: 0.0,
              providerSid: messageId,
              sentAt: new Date(payload?.received_at || payload?.created_at || Date.now()),
            },
          });
        }
      }
    }

    // ── Outbound delivery status update ──────────────────────────────
    // Telnyx fires 'message.finalized' when delivery is confirmed or failed
    if (eventType === 'message.finalized') {
      const messageId = payload?.id || '';
      const telnyxStatus = payload?.to?.[0]?.status || payload?.status || '';
      // Map Telnyx statuses: delivered, failed, rejected, sending, queued
      const dbStatus =
        telnyxStatus === 'delivered' ? 'delivered'
        : telnyxStatus === 'failed' || telnyxStatus === 'rejected' ? 'failed'
        : telnyxStatus === 'sending' ? 'sent'
        : telnyxStatus; // keep as-is for queued etc.

      if (messageId && dbStatus) {
        await prisma.message.updateMany({
          where: { providerSid: messageId },
          data: { status: dbStatus },
        });
        console.log(`[Telnyx] message.finalized: ${messageId} → ${dbStatus}`);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Telnyx Webhook Error:', error);
    return NextResponse.json({ error: (error as Error)?.message }, { status: 500 });
  }
}
