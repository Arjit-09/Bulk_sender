// WhatsApp Cloud API (Meta) Integration
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  toPhone: string,
  templateName: string,
  templateParams: string[] = [],
  languageCode: string = 'en_US'
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error: 'WhatsApp credentials not configured. Please add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in Settings.',
    };
  }

  // Normalize phone number to E.164 format
  let cleanTo = toPhone.replace(/[\s()-]/g, '').trim();
  if (!cleanTo.startsWith('+')) {
    cleanTo = '+' + cleanTo;
  }
  // Remove leading + for WhatsApp API (it expects number without +)
  const waTo = cleanTo.replace(/^\+/, '');

  try {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: waTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components:
          templateParams.length > 0
            ? [
                {
                  type: 'body',
                  parameters: templateParams.map((p) => ({ type: 'text', text: p })),
                },
              ]
            : [],
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', JSON.stringify(data));
      const errMsg =
        data?.error?.message ||
        data?.error?.error_user_msg ||
        `WhatsApp API error (HTTP ${response.status})`;
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    return {
      success: true,
      messageId,
      status: 'sent',
    };
  } catch (err: unknown) {
    console.error('WhatsApp Network Error:', err);
    return {
      success: false,
      error: (err as Error)?.message || 'Failed to connect to WhatsApp Cloud API',
    };
  }
}

export async function sendWhatsAppTextMessage(
  toPhone: string,
  text: string
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error: 'WhatsApp credentials not configured. Please add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in Settings.',
    };
  }

  let cleanTo = toPhone.replace(/[\s()-]/g, '').trim();
  if (!cleanTo.startsWith('+')) cleanTo = '+' + cleanTo;
  const waTo = cleanTo.replace(/^\+/, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: waTo,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', JSON.stringify(data));
      return {
        success: false,
        error:
          data?.error?.message ||
          `WhatsApp API error (HTTP ${response.status})`,
      };
    }

    const messageId = data?.messages?.[0]?.id;
    return { success: true, messageId, status: 'sent' };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || 'Failed to connect to WhatsApp Cloud API',
    };
  }
}

export async function getWhatsAppTemplates(): Promise<{
  success: boolean;
  templates?: unknown[];
  error?: string;
}> {
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!wabaId || !accessToken) {
    return {
      success: false,
      error: 'WhatsApp Business Account ID or Access Token not configured.',
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/message_templates?fields=name,status,category,language,components&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || 'Failed to fetch WhatsApp templates',
      };
    }

    return { success: true, templates: data?.data || [] };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error)?.message || 'Network error fetching templates',
    };
  }
}
