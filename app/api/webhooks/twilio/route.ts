import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fromPhone = formData.get('From')?.toString() || '';
    const toPhone = formData.get('To')?.toString() || '';
    const content = formData.get('Body')?.toString() || '';
    const messageSid = formData.get('MessageSid')?.toString() || '';

    if (!fromPhone || !content) {
      return new NextResponse('<Response></Response>', {
        status: 400,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

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

    // Save inbound message in PostgreSQL
    await prisma.message.create({
      data: {
        contactId: contact.id,
        direction: 'inbound',
        toPhone,
        fromPhone,
        content: content.trim(),
        status: 'delivered',
        cost: 0.0,
        providerSid: messageSid,
      },
    });

    // Return empty TwiML response so Twilio knows it was received
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('Twilio Webhook Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
