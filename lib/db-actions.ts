'use server';

import prisma from './prisma';
import { fetchTelnyxInboundMessages, inspectDestination } from './telnyx';
import { dispatchSms } from './sms';
import { sendWhatsAppMessage } from './whatsapp';
import { sendEmailMessage } from './email';

export type DbStatus = {
  connected: boolean;
  error?: string;
  database?: string;
};

export async function checkDatabaseConnection(): Promise<DbStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, database: 'PostgreSQL' };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Unable to connect to PostgreSQL',
    };
  }
}

// ======================= DASHBOARD & ANALYTICS =======================
export async function getDashboardStats() {
  try {
    const isConn = await checkDatabaseConnection();
    if (!isConn.connected) {
      return {
        connected: false,
        error: isConn.error,
        totalSent: 0,
        deliveredCount: 0,
        failedCount: 0,
        deliveryRate: 0,
        totalSpent: 0,
        totalContacts: 0,
        activeCampaigns: 0,
        balance: 48.5,
        recentCampaigns: [],
        dailyActivity: [],
        deliveryBreakdown: { delivered: 0, sent: 0, failed: 0, pending: 0 },
        carrierStats: { tollFree: 0, localVoip: 0, whatsApp: 0, email: 0 },
      };
    }

    const [
      totalSent,
      deliveredCount,
      failedCount,
      totalContacts,
      activeCampaigns,
      spentResult,
      recentCampaigns,
      allMessages,
      setting,
    ] = await Promise.all([
      prisma.message.count({ where: { direction: 'outbound', isDeleted: false } }),
      prisma.message.count({ where: { status: 'delivered', direction: 'outbound', isDeleted: false } }),
      prisma.message.count({ where: { status: 'failed', direction: 'outbound', isDeleted: false } }),
      prisma.contact.count(),
      prisma.campaign.count({ where: { status: 'running' } }),
      prisma.message.aggregate({ where: { isDeleted: false }, _sum: { cost: true } }),
      prisma.campaign.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      prisma.message.findMany({
        where: { isDeleted: false },
        take: 2000,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.setting.findFirst(),
    ]);

    const deliveryRate =
      totalSent > 0 ? Number(((deliveredCount / totalSent) * 100).toFixed(1)) : 99.4;
    const totalSpent = spentResult._sum.cost ? Number(spentResult._sum.cost.toFixed(4)) : 0;
    const balance = setting?.balance ?? 48.5;

    // Aggregate daily activity for the last 7 days
    const now = new Date();
    const daysMap = new Map<string, { day: string; date: string; sent: number; delivered: number; failed: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysMap.set(key, { day: dayName, date: key, sent: 0, delivered: 0, failed: 0 });
    }

    let delCount = 0;
    let sntCount = 0;
    let failCount = 0;
    let pendCount = 0;

    let tfCount = 0;
    let localCount = 0;
    let waCount = 0;
    let emailCount = 0;

    for (const msg of allMessages) {
      const dayKey = msg.sentAt.toISOString().split('T')[0];
      if (daysMap.has(dayKey)) {
        const entry = daysMap.get(dayKey)!;
        entry.sent += 1;
        if (msg.status === 'delivered') entry.delivered += 1;
        if (msg.status === 'failed') entry.failed += 1;
      }

      if (msg.status === 'delivered') delCount++;
      else if (msg.status === 'sent') sntCount++;
      else if (msg.status === 'failed') failCount++;
      else pendCount++;

      if (msg.channel === 'whatsapp') waCount++;
      else if (msg.channel === 'email') emailCount++;
      else if (msg.senderRoute === 'local' || (msg.fromPhone && msg.fromPhone.includes('479'))) localCount++;
      else tfCount++;
    }

    return {
      connected: true,
      totalSent,
      deliveredCount,
      failedCount,
      deliveryRate,
      totalSpent,
      totalContacts,
      activeCampaigns,
      balance,
      recentCampaigns,
      dailyActivity: Array.from(daysMap.values()),
      deliveryBreakdown: {
        delivered: delCount,
        sent: sntCount,
        failed: failCount,
        pending: pendCount,
      },
      carrierStats: {
        tollFree: tfCount,
        localVoip: localCount,
        whatsApp: waCount,
        email: emailCount,
      },
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
      totalSent: 0,
      deliveredCount: 0,
      failedCount: 0,
      deliveryRate: 0,
      totalSpent: 0,
      totalContacts: 0,
      activeCampaigns: 0,
      balance: 48.5,
      recentCampaigns: [],
      dailyActivity: [],
      deliveryBreakdown: { delivered: 0, sent: 0, failed: 0, pending: 0 },
      carrierStats: { tollFree: 0, localVoip: 0, whatsApp: 0, email: 0 },
    };
  }
}

// ======================= CONTACTS =======================
export async function getContacts(searchQuery?: string, groupFilter?: string) {
  try {
    const where: any = {};
    if (searchQuery && searchQuery.trim()) {
      where.OR = [
        { name: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { phone: { contains: searchQuery.trim() } },
        { email: { contains: searchQuery.trim(), mode: 'insensitive' } },
      ];
    }
    if (groupFilter && groupFilter !== 'All') {
      where.group = { name: groupFilter };
    }

    return await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { group: true },
    });
  } catch {
    return [];
  }
}

export async function createContact(data: {
  name: string;
  phone: string;
  email?: string;
  groupName?: string;
  country?: string;
  carrierType?: string;
}) {
  let groupId: string | undefined = undefined;
  if (data.groupName && data.groupName.trim()) {
    const group = await prisma.contactGroup.upsert({
      where: { name: data.groupName.trim() },
      update: {},
      create: { name: data.groupName.trim() },
    });
    groupId = group.id;
  }

  const cleanPhone = data.phone.trim().replace(/[\s()\-.]/g, '');
  const toPhone = cleanPhone.startsWith('+') ? cleanPhone : '+' + cleanPhone;

  return await prisma.contact.create({
    data: {
      name: data.name.trim(),
      phone: toPhone,
      email: data.email?.trim() || null,
      country: data.country || (toPhone.startsWith('+1416') || toPhone.startsWith('+1514') ? 'CA' : 'US'),
      carrierType: data.carrierType || 'mobile',
      groupId,
      status: 'active',
    },
  });
}

export async function deleteContact(id: string) {
  return await prisma.contact.delete({ where: { id } });
}

export async function bulkImportContacts(
  contacts: Array<{ name: string; phone: string; email?: string; group?: string; country?: string }>
) {
  let importedCount = 0;
  for (const c of contacts) {
    if (!c.phone) continue;
    let groupId: string | undefined = undefined;
    if (c.group && c.group.trim()) {
      const grp = await prisma.contactGroup.upsert({
        where: { name: c.group.trim() },
        update: {},
        create: { name: c.group.trim() },
      });
      groupId = grp.id;
    }

    const clean = c.phone.trim().replace(/[\s()\-.]/g, '');
    const phone = clean.startsWith('+') ? clean : '+' + clean;

    await prisma.contact.create({
      data: {
        name: c.name || 'Customer',
        phone,
        email: c.email?.trim() || null,
        country: c.country || 'US',
        carrierType: 'mobile',
        groupId,
        status: 'active',
      },
    });
    importedCount++;
  }
  return { count: importedCount };
}

export async function getContactGroups() {
  try {
    return await prisma.contactGroup.findMany({
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: 'asc' },
    });
  } catch {
    return [];
  }
}

// ======================= TEMPLATES =======================
export async function getTemplates(channel?: string) {
  try {
    const where: any = {};
    if (channel && channel !== 'all') {
      where.channel = channel;
    }
    return await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export async function createTemplate(data: {
  name: string;
  content: string;
  category?: string;
  channel?: string;
  subject?: string;
  metaHeader?: string;
  metaFooter?: string;
  metaButtons?: string;
}) {
  return await prisma.template.create({
    data: {
      name: data.name.trim(),
      content: data.content.trim(),
      category: data.category || 'General',
      channel: data.channel || 'sms',
      subject: data.subject?.trim() || null,
      metaHeader: data.metaHeader?.trim() || null,
      metaFooter: data.metaFooter?.trim() || null,
      metaButtons: data.metaButtons || null,
    },
  });
}

export async function deleteTemplate(id: string) {
  return await prisma.template.delete({ where: { id } });
}

// ======================= CAMPAIGNS =======================
export async function getCampaigns(channel?: string) {
  try {
    const where: any = {};
    if (channel && channel !== 'all') {
      where.channel = channel;
    }
    return await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
  } catch {
    return [];
  }
}

export async function createAndRunCampaign(data: {
  name: string;
  channel?: 'sms' | 'whatsapp' | 'email';
  senderRoute?: 'toll_free' | 'local' | 'whatsapp' | 'email';
  templateId?: string;
  customMessage?: string;
  groupName?: string;
  emailSubject?: string;
}) {
  const channel = data.channel || 'sms';
  const where: any = {};
  if (data.groupName && data.groupName !== 'All Contacts') {
    where.group = { name: data.groupName };
  }
  const targetContacts = await prisma.contact.findMany({ where });
  const total = targetContacts.length;

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name.trim(),
      channel,
      senderRoute: data.senderRoute || (channel === 'whatsapp' ? 'whatsapp' : 'toll_free'),
      templateId: data.templateId || null,
      groupName: data.groupName || 'All Contacts',
      status: total > 0 ? 'running' : 'completed',
      sentCount: 0,
      delivCount: 0,
      failedCount: 0,
      cost: 0,
    },
  });

  if (total === 0) {
    return campaign;
  }

  let templateContent = data.customMessage || '';
  if (data.templateId) {
    const tpl = await prisma.template.findUnique({ where: { id: data.templateId } });
    if (tpl) templateContent = tpl.content;
  }

  let sent = 0;
  let deliv = 0;
  let failed = 0;
  const unitCost = channel === 'whatsapp' ? 0.015 : channel === 'email' ? 0.001 : 0.0075;

  for (const c of targetContacts) {
    const text = templateContent
      ? templateContent.replace(/\{\{name\}\}/gi, c.name).replace(/\{\{phone\}\}/gi, c.phone)
      : 'Hello from Zenith Tech Cloud Platform';

    let success = false;
    let providerSid: string | undefined = undefined;

    if (channel === 'whatsapp') {
      const waRes = await sendWhatsAppMessage({ toPhone: c.phone, content: text, contactId: c.id });
      success = waRes.success;
      providerSid = waRes.messageId;
    } else if (channel === 'email' && c.email) {
      const emRes = await sendEmailMessage({
        toEmail: c.email,
        subject: data.emailSubject || 'ZenithTech Update',
        content: text,
      });
      success = emRes.success;
      providerSid = emRes.messageId;
    } else {
      const smsRes = await dispatchSms(c.phone, text, {
        routePreference: (data.senderRoute as any) || 'toll_free',
      });
      success = smsRes.success;
      providerSid = smsRes.sid;

      await prisma.message.create({
        data: {
          campaignId: campaign.id,
          contactId: c.id,
          channel: 'sms',
          senderRoute: smsRes.routedVia || 'toll_free',
          direction: 'outbound',
          toPhone: c.phone,
          fromPhone: smsRes.senderPhone || (data.senderRoute === 'local' ? '+14795909259' : '+18884020949'),
          content: text,
          status: success ? 'delivered' : 'failed',
          cost: unitCost,
          providerSid: providerSid || null,
        },
      });
    }

    sent++;
    if (success) deliv++;
    else failed++;
  }

  const finalCost = Number((sent * unitCost).toFixed(4));
  return await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'completed',
      sentCount: sent,
      delivCount: deliv,
      failedCount: failed,
      cost: finalCost,
    },
  });
}

export async function deleteCampaign(id: string) {
  await prisma.message.deleteMany({ where: { campaignId: id } });
  return await prisma.campaign.delete({ where: { id } });
}

// ======================= TWO-WAY INBOX (WhatsApp-Style) =======================
function canonicalPhone(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/[\s()\-.]/g, '').trim();
  if (/^[2-9]\d{9}$/.test(clean)) return '+1' + clean;
  if (clean.length === 11 && clean.startsWith('1')) return '+' + clean;
  if (!clean.startsWith('+') && clean.length >= 7) return '+' + clean;
  return clean;
}

export async function getInboxThreads() {
  try {
    const messages = await prisma.message.findMany({
      where: { isDeleted: false },
      orderBy: { sentAt: 'desc' },
      include: { contact: true },
      take: 250,
    });

    const threadMap = new Map<
      string,
      {
        phone: string;
        name: string;
        lastMessage: string;
        lastTimestamp: Date;
        direction: string;
        status: string;
        unreadCount: number;
        channel: string;
        senderRoute?: string;
        country?: string;
        carrierType?: string;
        contactId?: string;
      }
    >();

    for (const msg of messages) {
      const rawPartner =
        msg.direction === 'inbound'
          ? (msg.fromPhone || msg.toPhone)
          : msg.toPhone;

      const phone = canonicalPhone(rawPartner) || rawPartner;

      if (!threadMap.has(phone)) {
        const resolvedStatus =
          msg.status === 'delivery_unconfirmed' || msg.status === 'queued'
            ? 'sent'
            : msg.status;

        const isCA = phone.startsWith('+1416') || phone.startsWith('+1514') || phone.startsWith('+1604');
        const country = msg.contact?.country || (isCA ? 'CA' : 'US');

        threadMap.set(phone, {
          phone,
          name: msg.contact?.name || phone,
          lastMessage: msg.content,
          lastTimestamp: msg.sentAt,
          direction: msg.direction,
          status: resolvedStatus,
          unreadCount: msg.direction === 'inbound' ? 1 : 0,
          channel: msg.channel || 'sms',
          senderRoute: msg.senderRoute || (msg.fromPhone?.includes('479') ? 'local' : 'toll_free'),
          country,
          carrierType: msg.contact?.carrierType || 'mobile',
          contactId: msg.contact?.id,
        });
      }
    }

    return Array.from(threadMap.values());
  } catch {
    return [];
  }
}

export async function getMessagesForPhone(phone: string) {
  try {
    const clean = phone.replace(/[\s()\-.]/g, '').trim();
    const withPlus = clean.startsWith('+') ? clean : '+' + clean;
    const withoutPlus = clean.startsWith('+') ? clean.slice(1) : clean;
    const last10 = clean.slice(-10);

    const matchVariants = Array.from(new Set([phone, clean, withPlus, withoutPlus])).filter(Boolean);

    const msgs = await prisma.message.findMany({
      where: {
        isDeleted: false,
        OR: [
          { toPhone: { in: matchVariants } },
          { fromPhone: { in: matchVariants } },
          { toPhone: { endsWith: last10 } },
          { fromPhone: { endsWith: last10 } },
        ],
      },
      orderBy: { sentAt: 'asc' },
    });

    return msgs;
  } catch {
    return [];
  }
}

/**
 * Delete a single message from chat (Supports WhatsApp-style "Delete for me")
 */
export async function deleteMessage(messageId: string) {
  try {
    await prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete entire conversation thread for a phone number
 */
export async function deleteInboxThread(phone: string) {
  try {
    const clean = phone.replace(/[\s()\-.]/g, '').trim();
    const withPlus = clean.startsWith('+') ? clean : '+' + clean;
    const withoutPlus = clean.startsWith('+') ? clean.slice(1) : clean;
    const last10 = clean.slice(-10);

    const matchVariants = Array.from(new Set([phone, clean, withPlus, withoutPlus])).filter(Boolean);

    await prisma.message.updateMany({
      where: {
        OR: [
          { toPhone: { in: matchVariants } },
          { fromPhone: { in: matchVariants } },
          { toPhone: { endsWith: last10 } },
          { fromPhone: { endsWith: last10 } },
        ],
      },
      data: { isDeleted: true },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Clears message history for a phone number
 */
export async function clearInboxThread(phone: string) {
  return await deleteInboxThread(phone);
}

/**
 * Sends a direct message via Toll-Free, Local, or WhatsApp
 */
export async function sendDirectMessage(
  toPhone: string,
  content: string,
  senderOverride?: string,
  routePreference?: 'toll_free' | 'local' | 'auto',
  channel: 'sms' | 'whatsapp' = 'sms'
) {
  try {
    const targetPhone = canonicalPhone(toPhone) || toPhone;
    const last10 = targetPhone.replace(/[\s()\-.]/g, '').slice(-10);

    let contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone: targetPhone },
          { phone: toPhone },
          { phone: { endsWith: last10 } },
        ],
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: `Contact (${targetPhone.slice(-4)})`,
          phone: targetPhone,
          country: targetPhone.startsWith('+1416') ? 'CA' : 'US',
          status: 'active',
        },
      });
    }

    if (channel === 'whatsapp') {
      const waRes = await sendWhatsAppMessage({
        toPhone: targetPhone,
        content: content.trim(),
        contactId: contact.id,
      });
      return waRes;
    }

    // SMS Dispatch with Dual-Account Routing
    const result = await dispatchSms(targetPhone, content.trim(), {
      fromPhone: senderOverride,
      routePreference,
    });

    const rawStatus = result.status;
    const status = result.success
      ? (rawStatus && rawStatus !== 'queued' && rawStatus !== 'delivery_unconfirmed' ? rawStatus : 'sent')
      : 'failed';

    const msg = await prisma.message.create({
      data: {
        contactId: contact.id,
        channel: 'sms',
        senderRoute: result.routedVia === 'local' ? 'local' : 'toll_free',
        direction: 'outbound',
        toPhone: targetPhone,
        fromPhone: result.senderPhone || senderOverride || '+18884020949',
        content: content.trim(),
        status,
        cost: result.cost || 0.0075,
        providerSid: result.sid || null,
      },
    });

    // Deduct balance
    const setting = await prisma.setting.findFirst();
    if (setting) {
      await prisma.setting.update({
        where: { id: setting.id },
        data: { balance: Math.max(0, setting.balance - (result.cost || 0.0075)) },
      });
    }

    if (!result.success && result.error) {
      return { ...msg, error: result.error };
    }

    return msg;
  } catch (err: any) {
    console.error('Error sending direct message:', err);
    return { error: err?.message || 'Failed to dispatch message.' };
  }
}

export async function simulateInboundReply(fromPhone: string, text: string, channel: 'sms' | 'whatsapp' = 'sms') {
  let contact = await prisma.contact.findFirst({ where: { phone: fromPhone } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: `Contact (${fromPhone.slice(-4)})`,
        phone: fromPhone,
        country: 'US',
        status: 'active',
      },
    });
  }

  return await prisma.message.create({
    data: {
      contactId: contact.id,
      channel,
      senderRoute: 'toll_free',
      direction: 'inbound',
      toPhone: '+18884020949',
      fromPhone,
      content: text.trim(),
      status: 'delivered',
      cost: 0.0,
    },
  });
}

// ======================= USERS & RBAC =======================
export async function getUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch {
    return [];
  }
}

export async function createUser(data: { name: string; email: string; role?: string }) {
  const avatar = data.name.slice(0, 2).toUpperCase();
  return await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role || 'MEMBER',
      avatar,
      status: 'active',
    },
  });
}

export async function updateUserRole(id: string, role: string) {
  return await prisma.user.update({
    where: { id },
    data: { role },
  });
}

export async function deleteUser(id: string) {
  return await prisma.user.delete({ where: { id } });
}

// ======================= SETTINGS & RESET =======================
export async function getSettings() {
  try {
    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          provider: 'telnyx',
          fromPhone: process.env.TELNYX_PHONE_NUMBER || '+18884020949',
          authToken: process.env.TELNYX_API_KEY || '',
          tollFreeNumber: process.env.TELNYX_PHONE_NUMBER || '+18884020949',
          tollFreeApiKey: process.env.TELNYX_API_KEY || '',
          tollFreeProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID || '4001a0fd-9be4-4b36-a8ef-7dfd7462992b',
          localNumber: process.env.TELNYX_LOCAL_NUMBER || '+14795909259',
          localApiKey: process.env.TELNYX_LOCAL_API_KEY || '',
          localProfileId: process.env.TELNYX_LOCAL_MESSAGING_PROFILE_ID || '4001a0c9-9e1c-444e-ad71-a18b1bdeb2da',
          balance: 48.5,
        },
      });
    }
    return setting;
  } catch {
    return {
      id: '',
      provider: 'telnyx',
      accountSid: '',
      fromPhone: process.env.TELNYX_PHONE_NUMBER || '+18884020949',
      authToken: process.env.TELNYX_API_KEY || '',
      tollFreeNumber: process.env.TELNYX_PHONE_NUMBER || '+18884020949',
      tollFreeApiKey: process.env.TELNYX_API_KEY || '',
      tollFreeProfileId: '4001a0fd-9be4-4b36-a8ef-7dfd7462992b',
      localNumber: process.env.TELNYX_LOCAL_NUMBER || '+14795909259',
      localApiKey: process.env.TELNYX_LOCAL_API_KEY || '',
      localProfileId: '4001a0c9-9e1c-444e-ad71-a18b1bdeb2da',
      waPhoneNumberId: '',
      waBusinessId: '',
      waApiKey: '',
      waWebhookToken: 'zenith_wa_webhook_token',
      emailProvider: 'smtp',
      emailFromAddr: 'notifications@zenithtech.site',
      emailFromName: 'ZenithTech Omnichannel PaaS',
      smtpHost: 'smtp.mailgun.org',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      balance: 48.5,
    };
  }
}

export async function updateSettings(data: {
  tollFreeNumber?: string;
  tollFreeApiKey?: string;
  tollFreeProfileId?: string;
  localNumber?: string;
  localApiKey?: string;
  localProfileId?: string;
  waPhoneNumberId?: string;
  waBusinessId?: string;
  waApiKey?: string;
  waWebhookToken?: string;
  emailProvider?: string;
  emailFromAddr?: string;
  emailFromName?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  balance?: number;
}) {
  const setting = await prisma.setting.findFirst();
  if (!setting) {
    return await prisma.setting.create({
      data: {
        provider: 'telnyx',
        tollFreeNumber: data.tollFreeNumber || '+18884020949',
        tollFreeApiKey: data.tollFreeApiKey || '',
        tollFreeProfileId: data.tollFreeProfileId || '',
        localNumber: data.localNumber || '+14795909259',
        localApiKey: data.localApiKey || '',
        localProfileId: data.localProfileId || '',
        waPhoneNumberId: data.waPhoneNumberId || '',
        waBusinessId: data.waBusinessId || '',
        waApiKey: data.waApiKey || '',
        waWebhookToken: data.waWebhookToken || 'zenith_wa_webhook_token',
        emailProvider: data.emailProvider || 'smtp',
        emailFromAddr: data.emailFromAddr || 'notifications@zenithtech.site',
        emailFromName: data.emailFromName || 'ZenithTech Omnichannel PaaS',
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || '',
        smtpPass: data.smtpPass || '',
        fromPhone: data.tollFreeNumber || '+18884020949',
        balance: data.balance ?? 48.5,
      },
    });
  }

  return await prisma.setting.update({
    where: { id: setting.id },
    data: {
      tollFreeNumber: data.tollFreeNumber,
      tollFreeApiKey: data.tollFreeApiKey,
      tollFreeProfileId: data.tollFreeProfileId,
      localNumber: data.localNumber,
      localApiKey: data.localApiKey,
      localProfileId: data.localProfileId,
      waPhoneNumberId: data.waPhoneNumberId,
      waBusinessId: data.waBusinessId,
      waApiKey: data.waApiKey,
      waWebhookToken: data.waWebhookToken,
      emailProvider: data.emailProvider,
      emailFromAddr: data.emailFromAddr,
      emailFromName: data.emailFromName,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUser: data.smtpUser,
      smtpPass: data.smtpPass,
      balance: data.balance,
      fromPhone: data.tollFreeNumber || setting.fromPhone,
    },
  });
}

export async function clearAllData() {
  await prisma.message.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.contactGroup.deleteMany();
  await prisma.template.deleteMany();
  return { success: true };
}

export async function syncTelnyxInbound() {
  return await fetchTelnyxInboundMessages();
}

export async function testSmsConnection(toPhone: string, override?: { apiKey?: string; fromPhone?: string; routePreference?: 'toll_free' | 'local' }) {
  return await dispatchSms(toPhone, 'Test message from Zenith Tech SMS Platform: Telnyx connected successfully! 🚀', override);
}
