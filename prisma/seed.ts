import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial production PaaS data...');

  // 1. Initial Users (Super Admin, Admin, Member)
  const users = [
    {
      email: 'superadmin@zenithtech.site',
      name: 'Arjit Sharma',
      role: 'SUPER_ADMIN',
      avatar: 'AS',
      status: 'active',
    },
    {
      email: 'admin@zenithtech.site',
      name: 'Operations Admin',
      role: 'ADMIN',
      avatar: 'OA',
      status: 'active',
    },
    {
      email: 'user@zenithtech.site',
      name: 'Campaign Manager',
      role: 'MEMBER',
      avatar: 'CM',
      status: 'active',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, status: u.status },
      create: u,
    });
  }

  // 2. Settings (Dual Telnyx Toll-Free + Local Accounts)
  const tollFreeNum = process.env.TELNYX_PHONE_NUMBER || '+18884020949';
  const tollFreeKey = process.env.TELNYX_API_KEY || '';
  const tollFreeProfile = process.env.TELNYX_MESSAGING_PROFILE_ID || '4001a0fd-9be4-4b36-a8ef-7dfd7462992b';

  const localNum = process.env.TELNYX_LOCAL_NUMBER || '+14795909259';
  const localKey = process.env.TELNYX_LOCAL_API_KEY || '';
  const localProfile = process.env.TELNYX_LOCAL_MESSAGING_PROFILE_ID || '4001a0c9-9e1c-444e-ad71-a18b1bdeb2da';

  const existingSetting = await prisma.setting.findFirst();
  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        provider: 'telnyx',
        fromPhone: tollFreeNum,
        authToken: tollFreeKey,
        tollFreeNumber: tollFreeNum,
        tollFreeApiKey: tollFreeKey,
        tollFreeProfileId: tollFreeProfile,
        localNumber: localNum,
        localApiKey: localKey,
        localProfileId: localProfile,
        balance: 48.5,
        waPhoneNumberId: '109283748291029',
        waBusinessId: 'waba_zenith_enterprise_01',
        emailProvider: 'smtp',
        emailFromAddr: 'support@zenithtech.site',
        emailFromName: 'ZenithTech SMS Cloud',
      },
    });
  } else {
    await prisma.setting.update({
      where: { id: existingSetting.id },
      data: {
        fromPhone: tollFreeNum,
        authToken: tollFreeKey,
        tollFreeNumber: tollFreeNum,
        tollFreeApiKey: tollFreeKey,
        tollFreeProfileId: tollFreeProfile,
        localNumber: localNum,
        localApiKey: localKey,
        localProfileId: localProfile,
      },
    });
  }

  // 3. Contact Groups (US & Canada focused)
  const groups = [
    { name: 'US Verified Customers', color: '#f97316' },
    { name: 'Canada VIP Members', color: '#ef4444' },
    { name: 'VoIP & Virtual Numbers', color: '#8b5cf6' },
    { name: 'Enterprise Leads', color: '#0ea5e9' },
  ];

  for (const g of groups) {
    await prisma.contactGroup.upsert({
      where: { name: g.name },
      update: { color: g.color },
      create: g,
    });
  }

  // 4. Initial US & Canada Contacts
  const usGroup = await prisma.contactGroup.findUnique({ where: { name: 'US Verified Customers' } });
  const caGroup = await prisma.contactGroup.findUnique({ where: { name: 'Canada VIP Members' } });
  const voipGroup = await prisma.contactGroup.findUnique({ where: { name: 'VoIP & Virtual Numbers' } });

  const contacts = [
    {
      name: 'Alexander Wright',
      phone: '+14155552671',
      email: 'alex.wright@sfbaytech.com',
      country: 'US',
      carrierType: 'mobile',
      groupId: usGroup?.id,
    },
    {
      name: 'Jessica Miller',
      phone: '+12125550198',
      email: 'jessica.m@nycapitol.org',
      country: 'US',
      carrierType: 'mobile',
      groupId: usGroup?.id,
    },
    {
      name: 'David Tremblay',
      phone: '+14165550143',
      email: 'david.t@torontofinance.ca',
      country: 'CA',
      carrierType: 'mobile',
      groupId: caGroup?.id,
    },
    {
      name: 'Emily Watson (VoIP)',
      phone: '+12393753770',
      email: 'emily.virtual@textnow.me',
      country: 'US',
      carrierType: 'voip',
      groupId: voipGroup?.id,
    },
  ];

  for (const c of contacts) {
    const existing = await prisma.contact.findFirst({ where: { phone: c.phone } });
    if (!existing) {
      await prisma.contact.create({ data: c });
    }
  }

  // 5. Initial Templates for SMS, WhatsApp, and Email
  const templates = [
    {
      name: 'US Toll-Free Promotion',
      channel: 'sms',
      category: 'Marketing',
      content: 'Hi {{name}}, ZenithTech exclusive: Get 25% off enterprise bulk messaging today! Reply STOP to opt out.',
    },
    {
      name: 'Canada Order Confirmation',
      channel: 'sms',
      category: 'Transactional',
      content: 'Hello {{name}}, your order #CA-9821 has been shipped via Canada Post. Track at: https://zenithtech.site/t/9821',
    },
    {
      name: 'WhatsApp Welcome & CTA',
      channel: 'whatsapp',
      category: 'Onboarding',
      content: 'Welcome to ZenithTech Cloud {{name}}! 🚀 Your omnichannel workspace is ready. Tap below to access your dashboard.',
      metaHeader: 'Welcome to ZenithTech',
      metaFooter: 'ZenithTech PaaS • Reply HELP for assistance',
      metaButtons: JSON.stringify([
        { type: 'URL', text: 'Open Portal', url: 'https://zenithtech.site/dashboard' },
        { type: 'QUICK_REPLY', text: 'Talk to Support' },
      ]),
    },
    {
      name: 'Product Launch Announcement',
      channel: 'email',
      category: 'Marketing',
      subject: 'Introducing ZenithTech Omnichannel PaaS ⚡',
      content: '<h1>Welcome {{name}}!</h1><p>We are thrilled to unveil our new dual-route US/Canada messaging engine, WhatsApp business suite, and real-time inbox.</p>',
    },
  ];

  for (const t of templates) {
    const existing = await prisma.template.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.template.create({ data: t });
    }
  }

  // Clean out any deleted messages or mock records if present
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
