export const CHANNELS = ["sms", "whatsapp", "email"] as const;
export type Channel = (typeof CHANNELS)[number];
export const PLANS = {
  starter: { name: "Starter", price: 999, limit: 10000, seats: 2 },
  growth: { name: "Growth", price: 2499, limit: 50000, seats: 5 },
  scale: { name: "Scale", price: 6999, limit: 200000, seats: 15 },
} as const;
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(
  value: unknown,
  message: string,
  status = 400,
): asserts value {
  if (!value) throw new HttpError(status, message);
}
export function field(value: unknown, name: string, max = 200): string {
  assert(
    typeof value === "string" && value.trim().length > 0 && value.length <= max,
    `${name} is required (maximum ${max} characters).`,
  );
  return value.trim();
}
export function channel(value: unknown): Channel {
  assert(CHANNELS.includes(value as Channel), "Choose a valid channel.");
  return value as Channel;
}
export function destination(value: unknown, kind: Channel) {
  const result = field(value, "Recipient", 254);
  assert(
    kind === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)
      : /^\+[1-9]\d{7,14}$/.test(result),
    kind === "email"
      ? "Enter a valid email."
      : "Use international format, for example +919876543210.",
  );
  return kind === "email" ? result.toLowerCase() : result;
}
export function canManage(role: string) {
  return role === "owner" || role === "admin";
}
export function dispatchEligibility(
  connection: { status: string; entityId?: string | null } | null,
  template: {
    channel: string;
    approval: string;
    providerTemplateId?: string | null;
    dltTemplateId?: string | null;
  },
) {
  assert(
    connection?.status === "verified",
    "Connect and verify this channel before sending.",
  );
  assert(
    template.approval === "approved",
    "This template must be approved before sending.",
  );
  if (template.channel === "sms")
    assert(
      connection.entityId &&
        template.providerTemplateId &&
        template.dltTemplateId,
      "Indian SMS requires a DLT entity, sender header and registered template.",
    );
  if (template.channel === "whatsapp")
    assert(
      template.providerTemplateId,
      "An approved Meta template name is required.",
    );
}
