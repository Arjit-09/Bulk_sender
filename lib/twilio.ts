import prisma from './prisma';

interface TwilioSendResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
}

export async function sendTwilioSms(toPhone: string, body: string): Promise<TwilioSendResult> {
  // Check settings from DB first, then fallback to .env
  const setting = await prisma.setting.findFirst();

  const accountSid = setting?.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = setting?.authToken || process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = setting?.fromPhone || process.env.TWILIO_PHONE_NUMBER;

  // If no credentials configured, return an error — don't simulate delivery
  if (!accountSid || !authToken || !fromPhone) {
    return {
      success: false,
      error: 'Twilio credentials not configured. Go to Settings and add your Account SID, Auth Token, and Twilio phone number.',
    };
  }

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toPhone,
        From: fromPhone,
        Body: body,
        // StatusCallback allows Twilio to POST delivery receipts (delivered/failed) back to us
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? { StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status` }
          : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API Error:', data);
      let errorDetail = data.message || `Twilio Error (${data.code || response.status})`;
      
      if (data.code === 572006) {
        errorDetail = `Twilio Trial Restriction (Error 572006): Free trial accounts cannot send custom API messages to Indian numbers (+91). To test live SMS: either send to a verified US (+1) number, or click "Upgrade for full access" in Twilio Console.`;
      } else if (data.code === 572002) {
        errorDetail = `Twilio Trial Restriction (Error 572002): The destination number ${toPhone} is not verified. Please go to Twilio Console -> Phone Numbers -> Verified Caller IDs to add it, or click "Upgrade for full access" to send to any number.`;
      } else if (data.code === 21608) {
        errorDetail = `Twilio Trial Restriction: Number is unverified. Add it in Twilio Console -> Verified Caller IDs, or Upgrade Twilio.`;
      }

      return {
        success: false,
        error: errorDetail,
      };
    }

    // Twilio returns statuses like "queued", "sent", "delivered", "failed"
    // We map Twilio's initial status; delivery receipts come via webhook
    return {
      success: true,
      sid: data.sid,
      status: data.status || 'sent',
    };
  } catch (err: any) {
    console.error('Twilio Network Error:', err);
    return {
      success: false,
      error: err.message || 'Network error calling Twilio API',
    };
  }
}

export async function fetchTwilioInboundMessages() {
  const setting = await prisma.setting.findFirst();
  const accountSid = setting?.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = setting?.authToken || process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = setting?.fromPhone || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhone) {
    return { count: 0 };
  }

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    // Fetch messages TO the Twilio number (inbound from customers), newest first, up to 100
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?To=${encodeURIComponent(twilioPhone)}&PageSize=100`;

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${authHeader}` },
    });

    if (!response.ok) return { count: 0 };

    const data = await response.json();
    const inboundList = data.messages || [];
    let imported = 0;

    for (const m of inboundList) {
      if (m.direction && m.direction.includes('inbound')) {
        const existing = await prisma.message.findFirst({
          where: { providerSid: m.sid },
        });
        if (!existing) {
          let contact = await prisma.contact.findFirst({
            where: { phone: m.from },
          });
          if (!contact) {
            contact = await prisma.contact.create({
              data: {
                name: `Sender (${m.from.slice(-4)})`,
                phone: m.from,
                status: 'active',
              },
            });
          }

          await prisma.message.create({
            data: {
              contactId: contact.id,
              direction: 'inbound',
              toPhone: m.to,
              fromPhone: m.from,
              content: m.body,
              status: 'delivered',
              cost: 0,
              providerSid: m.sid,
              sentAt: new Date(m.date_sent || m.date_created),
            },
          });
          imported++;
        }
      }
    }

    return { count: imported };
  } catch (err) {
    console.error('Inbound sync error:', err);
    return { count: 0 };
  }
}
