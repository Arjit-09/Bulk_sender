const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich database data...');

  // 1. Ensure Default Admin Users
  const users = [
    { email: 'arjit@zenithtech.site', name: 'Arjit Sharma', role: 'SUPER_ADMIN', avatar: 'AS', password: 'password123' },
    { email: 'sarah.ops@zenithtech.site', name: 'Sarah Miller', role: 'ADMIN', avatar: 'SM', password: 'password123' },
    { email: 'alex.m@zenithtech.site', name: 'Alex Morales', role: 'MEMBER', avatar: 'AM', password: 'password123' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, avatar: u.avatar },
      create: u
    });
  }

  // 2. Ensure Contact Groups
  const groupData = [
    { name: 'Enterprise Leads', color: '#3b82f6' },
    { name: 'US Verified Customers', color: '#10b981' },
    { name: 'VIP Customers', color: '#8b5cf6' },
    { name: 'VoIP & Virtual Numbers', color: '#f59e0b' },
    { name: 'Canada VIP Members', color: '#ec4899' }
  ];

  const groupMap = {};
  for (const g of groupData) {
    const created = await prisma.contactGroup.upsert({
      where: { name: g.name },
      update: { color: g.color },
      create: g
    });
    groupMap[g.name] = created.id;
  }

  // 3. Ensure Realistic Contacts
  const contacts = [
    { name: 'Emily Virtual', phone: '+12393753770', email: 'emily.virtual@textnow.me', country: 'US', carrierType: 'voip', status: 'active', groupId: groupMap['VoIP & Virtual Numbers'] },
    { name: 'David Thompson', phone: '+14165550143', email: 'david.t@torontofinance.ca', country: 'CA', carrierType: 'mobile', status: 'active', groupId: groupMap['Canada VIP Members'] },
    { name: 'Michael Chang', phone: '+12125550198', email: 'm.chang@nycaptital.com', country: 'US', carrierType: 'mobile', status: 'active', groupId: groupMap['US Verified Customers'] },
    { name: 'Sophia Rodriguez', phone: '+14155552471', email: 'sophia.r@sftech.io', country: 'US', carrierType: 'mobile', status: 'active', groupId: groupMap['US Verified Customers'] },
    { name: 'James Wilson', phone: '+13125556789', email: 'jwilson@chicagohealth.org', country: 'US', carrierType: 'mobile', status: 'active', groupId: groupMap['VIP Customers'] },
    { name: 'Liam Tremblay', phone: '+15145558912', email: 'liam.t@montrealdev.qc.ca', country: 'CA', carrierType: 'mobile', status: 'active', groupId: groupMap['Canada VIP Members'] },
    { name: 'Olivia Bennett', phone: '+12065553412', email: 'olivia.b@seattlecloud.com', country: 'US', carrierType: 'mobile', status: 'active', groupId: groupMap['Enterprise Leads'] },
    { name: 'Lucas Scott', phone: '+15125559021', email: 'lucas.s@austintech.co', country: 'US', carrierType: 'mobile', status: 'active', groupId: groupMap['Enterprise Leads'] },
    { name: 'Emma Watson', phone: '+16045557788', email: 'emma.w@vancouverretail.ca', country: 'CA', carrierType: 'mobile', status: 'active', groupId: groupMap['Canada VIP Members'] },
    { name: 'Noah Miller', phone: '+13055554321', email: 'noah.m@miamiventures.fl', country: 'US', carrierType: 'voip', status: 'active', groupId: groupMap['VoIP & Virtual Numbers'] }
  ];

  const contactList = [];
  for (const c of contacts) {
    const existing = await prisma.contact.findFirst({ where: { phone: c.phone } });
    if (existing) {
      contactList.push(existing);
    } else {
      const created = await prisma.contact.create({ data: c });
      contactList.push(created);
    }
  }

  // 4. Ensure Campaigns
  const campaigns = [
    { name: 'Q4 Black Friday VIP Blast', channel: 'sms', senderRoute: 'toll_free', groupName: 'VIP Customers', status: 'completed', sentCount: 1420, delivCount: 1395, failedCount: 25, cost: 21.30 },
    { name: 'Monthly Account Statement Alert', channel: 'email', senderRoute: 'email', groupName: 'Enterprise Leads', status: 'completed', sentCount: 12450, delivCount: 12240, failedCount: 210, cost: 12.45 },
    { name: 'WhatsApp Two-Factor & OTP Delivery', channel: 'whatsapp', senderRoute: 'whatsapp', groupName: 'US Verified Customers', status: 'running', sentCount: 4820, delivCount: 4790, failedCount: 30, cost: 38.56 },
    { name: 'Canada Flash Promo Alert', channel: 'sms', senderRoute: 'local', groupName: 'Canada VIP Members', status: 'completed', sentCount: 850, delivCount: 842, failedCount: 8, cost: 12.75 },
    { name: 'Security Verification Push', channel: 'whatsapp', senderRoute: 'whatsapp', groupName: 'All Contacts', status: 'completed', sentCount: 3100, delivCount: 3080, failedCount: 20, cost: 24.80 }
  ];

  for (const camp of campaigns) {
    const found = await prisma.campaign.findFirst({ where: { name: camp.name } });
    if (!found) {
      await prisma.campaign.create({ data: camp });
    }
  }

  // 5. Seed Realistic Message History (Over Last 7-30 Days for Charts & Inbox)
  const existingMsgCount = await prisma.message.count();
  console.log(`Current message count in DB: ${existingMsgCount}`);

  if (existingMsgCount < 200) {
    console.log('Generating dynamic omnichannel message data for 7-day and 30-day reporting...');
    const now = new Date();
    const channels = ['sms', 'whatsapp', 'email'];
    const statuses = ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'sent', 'failed']; // mostly delivered
    const batch = [];

    // Conversation threads for inbox realism
    for (const contact of contactList) {
      // Inbound inquiry
      const inboundDate = new Date(now.getTime() - Math.floor(Math.random() * 5 * 24 * 3600 * 1000));
      batch.push({
        contactId: contact.id,
        channel: contact.carrierType === 'voip' ? 'whatsapp' : 'sms',
        senderRoute: contact.country === 'CA' ? 'local' : 'toll_free',
        direction: 'inbound',
        toPhone: '+18884020949',
        fromPhone: contact.phone,
        content: `Hi ZenithTech, can you confirm if my enterprise discount is applied for this billing cycle?`,
        status: 'delivered',
        cost: 0.0,
        isDeleted: false,
        sentAt: inboundDate
      });

      // Outbound reply
      const replyDate = new Date(inboundDate.getTime() + 15 * 60 * 1000);
      batch.push({
        contactId: contact.id,
        channel: contact.carrierType === 'voip' ? 'whatsapp' : 'sms',
        senderRoute: contact.country === 'CA' ? 'local' : 'toll_free',
        direction: 'outbound',
        toPhone: contact.phone,
        fromPhone: '+18884020949',
        content: `Hello ${contact.name}! Yes, your tier-1 enterprise SLA discount is active on your account. Thank you!`,
        status: 'delivered',
        cost: 0.015,
        isDeleted: false,
        sentAt: replyDate
      });
    }

    // Historical messages distributed over the last 30 days
    for (let day = 0; day < 30; day++) {
      const msgsForDay = Math.floor(15 + Math.random() * 25);
      for (let i = 0; i < msgsForDay; i++) {
        const contact = contactList[i % contactList.length];
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const msgDate = new Date(now.getTime() - (day * 24 * 3600 * 1000 + Math.random() * 20 * 3600 * 1000));
        
        batch.push({
          contactId: contact.id,
          channel: channel,
          senderRoute: channel === 'sms' ? (contact.country === 'CA' ? 'local' : 'toll_free') : channel,
          direction: 'outbound',
          toPhone: contact.phone,
          fromPhone: channel === 'email' ? 'notifications@zenithtech.site' : '+18884020949',
          content: channel === 'whatsapp' 
            ? `Your ZenithTech verification passcode is ${Math.floor(100000 + Math.random() * 900000)}. Do not share this code.` 
            : channel === 'email'
            ? `Monthly system alert: Dual Telnyx carrier handshake latency is normal (<42ms).`
            : `ZenithTech PaaS alert: Campaign dispatch completed with 99.4% carrier delivery rate.`,
          status: status,
          cost: channel === 'email' ? 0.001 : 0.015,
          isDeleted: false,
          sentAt: msgDate
        });
      }
    }

    console.log(`Inserting ${batch.length} realistic messages...`);
    await prisma.message.createMany({ data: batch });
    console.log('Messages successfully seeded!');
  }

  // 6. Ensure Setting has balance
  await prisma.setting.upsert({
    where: { id: 'default_setting' },
    update: { balance: 64.84, tollFreeNumber: '+18884020949', localNumber: '+14795909259' },
    create: { id: 'default_setting', balance: 64.84, tollFreeNumber: '+18884020949', localNumber: '+14795909259' }
  });

  const finalCounts = {
    users: await prisma.user.count(),
    contacts: await prisma.contact.count(),
    campaigns: await prisma.campaign.count(),
    messages: await prisma.message.count(),
    delivered: await prisma.message.count({ where: { status: 'delivered' } }),
    sent: await prisma.message.count({ where: { status: 'sent' } }),
    failed: await prisma.message.count({ where: { status: 'failed' } })
  };

  console.log('Database Seeding Complete! Final Counts:', finalCounts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

