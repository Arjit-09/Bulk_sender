'use server';

import prisma from './prisma';
import { sendTwilioSms, fetchTwilioInboundMessages } from './twilio';

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
        balance: 25.0,
        recentCampaigns: [],
        dailyActivity: [],
        deliveryBreakdown: { delivered: 0, sent: 0, failed: 0, pending: 0 },
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
      prisma.message.count({ where: { direction: 'outbound' } }),
      prisma.message.count({ where: { status: 'delivered' } }),
      prisma.message.count({ where: { status: 'failed' } }),
      prisma.contact.count(),
      prisma.campaign.count({ where: { status: 'running' } }),
      prisma.message.aggregate({ _sum: { cost: true } }),
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { template: true },
      }),
      prisma.message.findMany({
        take: 100,
        orderBy: { sentAt: 'desc' },
      }),
      prisma.setting.findFirst(),
    ]);

    const deliveryRate =
      totalSent > 0 ? Number(((deliveredCount / totalSent) * 100).toFixed(1)) : 0;
    const totalSpent = spentResult._sum.cost ? Number(spentResult._sum.cost.toFixed(4)) : 0;
    const balance = setting?.balance ?? 25.0;

    // Aggregate daily activity for the last 7 days dynamically
    const now = new Date();
    const daysMap = new Map<string, { day: string; date: string; sent: number; delivered: number; failed: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysMap.set(key, { day: dayName, date: key, sent: 0, delivered: 0, failed: 0 });
    }

    for (const msg of allMessages) {
      const dayKey = msg.sentAt.toISOString().split('T')[0];
      if (daysMap.has(dayKey)) {
        const entry = daysMap.get(dayKey)!;
        entry.sent += 1;
        if (msg.status === 'delivered') entry.delivered += 1;
        if (msg.status === 'failed') entry.failed += 1;
      }
    }

    // Dynamic delivery breakdown
    let delCount = 0;
    let sntCount = 0;
    let failCount = 0;
    let pendCount = 0;
    for (const msg of allMessages) {
      if (msg.status === 'delivered') delCount++;
      else if (msg.status === 'sent') sntCount++;
      else if (msg.status === 'failed') failCount++;
      else pendCount++;
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
      balance: 25.0,
      recentCampaigns: [],
      dailyActivity: [],
      deliveryBreakdown: { delivered: 0, sent: 0, failed: 0, pending: 0 },
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

  return await prisma.contact.create({
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || null,
      groupId,
      status: 'active',
    },
  });
}

export async function deleteContact(id: string) {
  return await prisma.contact.delete({ where: { id } });
}

export async function bulkImportContacts(contacts: Array<{ name: string; phone: string; email?: string; group?: string }>) {
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

    await prisma.contact.create({
      data: {
        name: c.name || 'Unknown Contact',
        phone: c.phone.trim(),
        email: c.email?.trim() || null,
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
export async function getTemplates() {
  try {
    return await prisma.template.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export async function createTemplate(data: { name: string; content: string; category?: string }) {
  return await prisma.template.create({
    data: {
      name: data.name.trim(),
      content: data.content.trim(),
      category: data.category || 'General',
    },
  });
}

export async function deleteTemplate(id: string) {
  return await prisma.template.delete({ where: { id } });
}

// ======================= CAMPAIGNS =======================
export async function getCampaigns() {
  try {
    return await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
  } catch {
    return [];
  }
}

export async function createAndRunCampaign(data: {
  name: string;
  templateId?: string;
  customMessage?: string;
  groupName?: string;
}) {
  // Fetch target contacts
  const where: any = {};
  if (data.groupName && data.groupName !== 'All Contacts') {
    where.group = { name: data.groupName };
  }
  const targetContacts = await prisma.contact.findMany({ where });
  const total = targetContacts.length;

  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name.trim(),
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

  // Get message text
  let templateContent = data.customMessage || '';
  if (data.templateId) {
    const tpl = await prisma.template.findUnique({ where: { id: data.templateId } });
    if (tpl) templateContent = tpl.content;
  }

  let sent = 0;
  let deliv = 0;
  let failed = 0;
  const unitCost = 0.0079;

  for (const c of targetContacts) {
    // Replace dynamic variables
    const text = templateContent
      ? templateContent.replace(/\{\{name\}\}/gi, c.name).replace(/\{\{phone\}\}/gi, c.phone)
      : 'Hello from Bulk SMS Platform';

    // Dispatch via Twilio if configured, or simulated delivery
    const twilioRes = await sendTwilioSms(c.phone, text);
    const isSuccess = twilioRes.success;
    const status = isSuccess ? 'delivered' : 'failed';

    await prisma.message.create({
      data: {
        campaignId: campaign.id,
        contactId: c.id,
        direction: 'outbound',
        toPhone: c.phone,
        content: text,
        status,
        cost: unitCost,
        providerSid: twilioRes.sid || null,
      },
    });

    sent++;
    if (isSuccess) deliv++;
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

// ======================= TWO-WAY INBOX =======================
export async function getInboxThreads() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { sentAt: 'desc' },
      include: { contact: true },
      take: 100,
    });

    // Group messages by contact phone
    const threadMap = new Map<string, {
      phone: string;
      name: string;
      lastMessage: string;
      lastTimestamp: Date;
      direction: string;
      status: string;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const phone = msg.direction === 'inbound' ? (msg.fromPhone || msg.toPhone) : msg.toPhone;
      if (!threadMap.has(phone)) {
        threadMap.set(phone, {
          phone,
          name: msg.contact?.name || phone,
          lastMessage: msg.content,
          lastTimestamp: msg.sentAt,
          direction: msg.direction,
          status: msg.status,
          unreadCount: msg.direction === 'inbound' ? 1 : 0,
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
    return await prisma.message.findMany({
      where: {
        OR: [{ toPhone: phone }, { fromPhone: phone }],
      },
      orderBy: { sentAt: 'asc' },
    });
  } catch {
    return [];
  }
}

export async function sendDirectMessage(toPhone: string, content: string) {
  const contact = await prisma.contact.findFirst({ where: { phone: toPhone } });

  // Dispatch via Twilio if configured
  const twilioRes = await sendTwilioSms(toPhone, content.trim());
  const status = twilioRes.success ? 'delivered' : 'failed';

  const msg = await prisma.message.create({
    data: {
      contactId: contact?.id || null,
      direction: 'outbound',
      toPhone,
      content: content.trim(),
      status,
      cost: 0.0079,
      providerSid: twilioRes.sid || null,
    },
  });

  // Deduct balance
  const setting = await prisma.setting.findFirst();
  if (setting) {
    await prisma.setting.update({
      where: { id: setting.id },
      data: { balance: Math.max(0, setting.balance - 0.0079) },
    });
  }

  if (!twilioRes.success && twilioRes.error) {
    return { ...msg, error: twilioRes.error };
  }

  return msg;
}

export async function simulateInboundReply(fromPhone: string, text: string) {
  const contact = await prisma.contact.findFirst({ where: { phone: fromPhone } });

  return await prisma.message.create({
    data: {
      contactId: contact?.id || null,
      direction: 'inbound',
      toPhone: 'Platform (+1-800-SMS)',
      fromPhone,
      content: text.trim(),
      status: 'delivered',
      cost: 0.0,
    },
  });
}

// ======================= SETTINGS & RESET =======================
export async function getSettings() {
  try {
    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          provider: 'twilio',
          accountSid: '',
          authToken: '',
          fromPhone: '',
          balance: 25.0,
        },
      });
    }
    return setting;
  } catch {
    return {
      id: '',
      provider: 'twilio',
      accountSid: '',
      authToken: '',
      fromPhone: '',
      balance: 25.0,
    };
  }
}

export async function updateSettings(data: {
  accountSid?: string;
  authToken?: string;
  fromPhone?: string;
  balance?: number;
}) {
  let setting = await prisma.setting.findFirst();
  if (!setting) {
    return await prisma.setting.create({
      data: {
        provider: 'twilio',
        accountSid: data.accountSid || '',
        authToken: data.authToken || '',
        fromPhone: data.fromPhone || '',
        balance: data.balance ?? 25.0,
      },
    });
  }
  return await prisma.setting.update({
    where: { id: setting.id },
    data: {
      accountSid: data.accountSid,
      authToken: data.authToken,
      fromPhone: data.fromPhone,
      balance: data.balance,
    },
  });
}

export async function clearAllData() {
  // Allows the user to reset all tables to 0 records for fresh testing
  await prisma.message.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.contactGroup.deleteMany();
  await prisma.template.deleteMany();
  return { success: true };
}

export async function syncTwilioInbound() {
  return await fetchTwilioInboundMessages();
}
