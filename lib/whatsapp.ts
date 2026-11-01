import prisma from './prisma';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  status: string;
  error?: string;
}

export async function sendWhatsAppMessage(data: {
  toPhone: string;
  content: string;
  templateId?: string;
  contactId?: string;
}): Promise<WhatsAppSendResult> {
  try {
    const setting = await prisma.setting.findFirst();
    const cleanTo = data.toPhone.replace(/[\s()\-.]/g, '');
    const toPhone = cleanTo.startsWith('+') ? cleanTo : '+' + cleanTo;

    let contact = data.contactId
      ? await prisma.contact.findUnique({ where: { id: data.contactId } })
      : await prisma.contact.findFirst({ where: { phone: toPhone } });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: `WhatsApp (${toPhone.slice(-4)})`,
          phone: toPhone,
          country: toPhone.startsWith('+1') ? 'US' : 'INTL',
          carrierType: 'whatsapp',
          status: 'active',
        },
      });
    }

    const messageId = 'wam_' + Math.random().toString(36).substring(2, 12);

    const msg = await prisma.message.create({
      data: {
        contactId: contact.id,
        channel: 'whatsapp',
        senderRoute: 'whatsapp',
        direction: 'outbound',
        toPhone,
        fromPhone: setting?.waPhoneNumberId || '+18884020949',
        content: data.content.trim(),
        status: 'delivered', // simulated instant delivery for WhatsApp PaaS demo
        cost: 0.015,
        providerSid: messageId,
        sentAt: new Date(),
      },
    });

    // Deduct balance
    if (setting) {
      await prisma.setting.update({
        where: { id: setting.id },
        data: { balance: Math.max(0, setting.balance - 0.015) },
      });
    }

    return {
      success: true,
      messageId: msg.id,
      status: 'delivered',
    };
  } catch (err: unknown) {
    console.error('WhatsApp send error:', err);
    return {
      success: false,
      status: 'failed',
      error: (err as Error)?.message || 'Failed to dispatch WhatsApp message',
    };
  }
}
