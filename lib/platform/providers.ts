import type { ChannelConnection, Delivery } from "@prisma/client";
import { decrypt, unsubscribeToken } from "./crypto";
import { assert } from "./policy";
export async function deliver(
  message: Delivery,
  connection: ChannelConnection,
): Promise<string> {
  const secret = decrypt(connection.encryptedSecret);
  let url: string;
  let body: object;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  };
  if (message.channel === "email") {
    assert(process.env.APP_URL, "APP_URL is required for unsubscribe links.");
    const unsubscribe = `${process.env.APP_URL}/api/unsubscribe?id=${message.contactId}&token=${unsubscribeToken(message.contactId)}`;
    url = "https://api.resend.com/emails";
    headers["Idempotency-Key"] = message.id;
    body = {
      from: connection.sender,
      to: [message.destination],
      subject: message.subject,
      text: `${message.content}\n\nUnsubscribe: ${unsubscribe}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribe}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  } else if (message.channel === "whatsapp") {
    assert(
      process.env.META_GRAPH_VERSION &&
        /^v\d+\.0$/.test(process.env.META_GRAPH_VERSION),
      "Set a supported META_GRAPH_VERSION.",
    );
    url = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION}/${connection.sender}/messages`;
    body = {
      messaging_product: "whatsapp",
      to: message.destination.replace("+", ""),
      type: "template",
      template: {
        name: message.templateRef,
        language: { code: message.language },
      },
    };
  } else if (message.channel === "sms") {
    assert(
      connection.entityId && /^\+91[6-9]\d{9}$/.test(message.destination),
      "Verified India DLT route required.",
    );
    url = "https://control.msg91.com/api/v5/flow";
    delete headers.Authorization;
    headers.authkey = secret;
    body = {
      template_id: message.templateRef,
      short_url: "0",
      recipients: [{ mobiles: message.destination.slice(1) }],
    };
  } else {
    throw new Error("Unsupported channel.");
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  // Do not automatically retry ambiguous failures: Meta does not offer send idempotency here.
  if (!response.ok)
    throw new Error(
      `Provider returned HTTP ${response.status}. Reconcile before retrying.`,
    );
  const result = await response.json();
  if (message.channel === "sms")
    assert(result.type === "success", "MSG91 rejected the template request.");
  const id =
    message.channel === "email"
      ? result.id
      : message.channel === "sms"
        ? result.message
        : result.messages?.[0]?.id;
  assert(typeof id === "string", "Provider response has no message ID.");
  return id;
}
