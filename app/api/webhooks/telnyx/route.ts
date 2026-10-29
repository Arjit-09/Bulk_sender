import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.data?.event_type;
    const payload = body?.data?.payload;

    console.log(`[Telnyx Webhook] event_type=${eventType}`, JSON.stringify(payload, null, 2).slice(0, 600));

    // ── Inbound SMS received ──────────────────────────────────────────
    // Telnyx sends 'message.received' for inbound SMS to your number
    if (eventType === 'message.received') {
      const fromPhone =
        payload?.from?.phone_number ||
        payload?.from ||
        '';
      const toPhone =
        payload?.to?.[0]?.phone_number ||
        payload?.to?.[0] ||
        payload?.to ||
        '';
      const content = payload?.text || '';
      const messageId = payload?.id || '';

      console.log(`[Telnyx Inbound] from=${fromPhone} to=${toPhone} id=${messageId} text="${content?.slice(0, 80)}"`);

      if (fromPhone && content) {
        // Deduplicate by providerSid
        const existing = await prisma.message.findFirst({ where: { providerSid: messageId } });
        if (!existing) {
          // Auto-create contact if first time texting in
          let contact = await prisma.contact.findFirst({ where: { phone: fromPhone } });
          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                name: `Contact (${fromPhone.slice(-4)})`,
                phone: fromPhone,
                status: 'active',
              },
            });
            console.log(`[Telnyx Inbound] Created new contact for ${fromPhone}`);
          }

          await prisma.message.create({
            data: {
              contactId: contact.id,
              direction: 'inbound',
              toPhone: toPhone || '',
              fromPhone,
              content: content.trim(),
              status: 'delivered',
              cost: 0.0,
              providerSid: messageId || null,
              sentAt: new Date(payload?.received_at || payload?.created_at || Date.now()),
            },
          });
          console.log(`[Telnyx Inbound] Saved inbound message from ${fromPhone}`);
        } else {
          console.log(`[Telnyx Inbound] Duplicate message ${messageId} — skipped`);
        }
      } else {
        console.warn(`[Telnyx Inbound] Missing from/content — fromPhone="${fromPhone}" content="${content}"`);
      }
    }

    // ── Outbound delivery status update ──────────────────────────────
    // Telnyx sends 'message.finalized' when a message is delivered/failed
    if (eventType === 'message.finalized') {
      const messageId = payload?.id || '';
      const telnyxStatus =
        payload?.to?.[0]?.status ||
        payload?.status ||
        '';

      // Map Telnyx statuses to our DB statuses
      // 'delivery_unconfirmed' = carrier accepted but no DLR yet → treat as 'sent'
      const dbStatus =
        telnyxStatus === 'delivered' ? 'delivered'
        : telnyxStatus === 'failed' || telnyxStatus === 'rejected' ? 'failed'
        : telnyxStatus === 'delivery_unconfirmed' ? 'sent'
        : telnyxStatus === 'sending' || telnyxStatus === 'sent' ? 'sent'
        : telnyxStatus === 'queued' ? 'sent'
        : telnyxStatus;

      console.log(`[Telnyx DLR] message.finalized: id=${messageId} telnyx_status="${telnyxStatus}" → db_status="${dbStatus}"`);

      if (messageId && dbStatus) {
        const updated = await prisma.message.updateMany({
          where: { providerSid: messageId },
          data: { status: dbStatus },
        });
        console.log(`[Telnyx DLR] Updated ${updated.count} record(s) to status="${dbStatus}"`);
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Telnyx Webhook] Error:', error);
    return NextResponse.json({ error: (error as Error)?.message }, { status: 500 });
  }
}
