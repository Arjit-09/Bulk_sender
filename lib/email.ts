import prisma from './prisma';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  status: string;
  error?: string;
}

export async function sendEmailMessage(data: {
  toEmail: string;
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
}): Promise<EmailSendResult> {
  try {
    const setting = await prisma.setting.findFirst();

    const fromAddress = data.fromEmail || setting?.emailFromAddr || 'notifications@zenithtech.site';
    const fromName = data.fromName || setting?.emailFromName || 'ZenithTech Omnichannel PaaS';

    // Look for contact or create if needed
    let contact = await prisma.contact.findFirst({ where: { email: data.toEmail.trim() } });
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: data.toEmail.split('@')[0],
          phone: '+18880000000',
          email: data.toEmail.trim(),
          country: 'US',
          status: 'active',
        },
      });
    }

    const emailId = 'em_' + Math.random().toString(36).substring(2, 12);

    await prisma.message.create({
      data: {
        contactId: contact.id,
        channel: 'email',
        senderRoute: 'email',
        direction: 'outbound',
        toPhone: data.toEmail,
        fromPhone: `${fromName} <${fromAddress}>`,
        content: `[Subject: ${data.subject}]\n\n${data.content}`,
        status: 'delivered',
        cost: 0.001,
        providerSid: emailId,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      messageId: emailId,
      status: 'delivered',
    };
  } catch (err: unknown) {
    console.error('Email send error:', err);
    return {
      success: false,
      status: 'failed',
      error: (err as Error)?.message || 'Failed to dispatch email',
    };
  }
}
