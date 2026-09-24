import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.data?.event_type;

    // Telnyx sends 'message.received' when an inbound SMS arrives
    if (eventType === 'message.received') {
      const payload = body?.data?.payload;
      const fromPhone = payload?.from?.phone_number || '';
      const toPhone = payload?.to?.[0]?.phone_number || '';
      const content = payload?.text || '';
      const messageId = payload?.id || '';

      if (fromPhone && content) {
        // Find or create contact
        let contact = await prisma.contact.findFirst({
          where: { phone: fromPhone },
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              name: `Contact (${fromPhone.slice(-4)})`,
              phone: fromPhone,
              status: 'active',
            },
          });
        }

        // Save inbound reply into PostgreSQL
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
          },
        });
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Telnyx Webhook Error:', error);
    return NextResponse.json({ error: (error as Error)?.message }, { status: 500 });
  }
}
