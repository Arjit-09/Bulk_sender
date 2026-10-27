import prisma from "@/lib/prisma";
import { validHmac } from "@/lib/platform/crypto";
import { assert, PLANS } from "@/lib/platform/policy";
import { failure } from "@/lib/platform/auth";
type Context = { params: Promise<{ provider: string }> };
export async function GET(req: Request, ctx: Context) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  if (
    provider === "meta" &&
    process.env.META_VERIFY_TOKEN &&
    url.searchParams.get("hub.verify_token") ===
      process.env.META_VERIFY_TOKEN &&
    url.searchParams.get("hub.mode") === "subscribe"
  )
    return new Response(url.searchParams.get("hub.challenge"));
  return new Response("Forbidden", { status: 403 });
}
export async function POST(req: Request, ctx: Context) {
  try {
    const { provider } = await ctx.params;
    const raw = await req.text();
    assert(raw.length < 1000000, "Payload too large.", 413);
    if (provider === "razorpay") {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      assert(
        secret &&
          validHmac(raw, req.headers.get("x-razorpay-signature") || "", secret),
        "Invalid signature.",
        401,
      );
      const event = JSON.parse(raw);
      const subscription = event.payload?.subscription?.entity;
      assert(subscription?.id, "Subscription event required.");
      const eventId = req.headers.get("x-razorpay-event-id");
      assert(eventId, "Missing event ID.");
      await prisma.$transaction(
        async (tx) => {
          if (
            await tx.webhookReceipt.findUnique({
              where: { id: `razorpay:${eventId}` },
            })
          )
            return;
          // Serialize canonical fetches per subscription so concurrent callbacks cannot
          // overwrite newer state with an earlier in-flight provider response.
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${subscription.id}))`;
          // Fetch current canonical state instead of trusting event arrival order.
          const response = await fetch(
            `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscription.id)}`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
              },
              signal: AbortSignal.timeout(15000),
            },
          );
          assert(response.ok, "Could not verify subscription.", 503);
          const canonical = await response.json();
          const version = await tx.pricingVersion.findUnique({where:{razorpayPlanId:canonical.plan_id}});
          const plan = version?.planKey || Object.keys(PLANS).find(
            (p) =>
              process.env[`RAZORPAY_PLAN_${p.toUpperCase()}`] ===
              canonical.plan_id,
          );
          assert(plan, "Unrecognized billing plan.");
          const workspace = await tx.workspace.findUnique({
            where: { subscriptionId: subscription.id },
          });
          assert(workspace, "Subscription not linked yet.", 503);
          await tx.workspace.update({
            where: { id: workspace.id },
            data: {
              plan,
              subscriptionStatus: canonical.status,
              billingThrough: canonical.current_end
                ? new Date(canonical.current_end * 1000)
                : null,
            },
          });
          await tx.webhookReceipt.create({
            data: { id: `razorpay:${eventId}` },
          });
          await tx.auditEvent.create({
            data: {
              workspaceId: workspace.id,
              actorId: "razorpay",
              action: "billing.updated",
              detail: canonical.status,
            },
          });
        },
        { timeout: 25000 },
      );
    } else if (provider === "meta") {
      const secret = process.env.META_APP_SECRET;
      assert(
        secret &&
          validHmac(
            raw,
            (req.headers.get("x-hub-signature-256") || "").replace(
              /^sha256=/,
              "",
            ),
            secret,
          ),
        "Invalid signature.",
        401,
      );
      const event = JSON.parse(raw);
      for (const entry of event.entry || [])
        for (const change of entry.changes || []) {
          const value = change.value;
          const sender = value?.metadata?.phone_number_id;
          if (!sender) continue;
          const connections = await prisma.channelConnection.findMany({
            where: { channel: "whatsapp", sender },
            select: { workspaceId: true },
          });
          for (const connection of connections) {
            for (const status of value.statuses || []) {
              const predecessors: Record<string, string[]> = {
                sent: ["accepted"],
                delivered: ["accepted", "sent"],
                read: ["accepted", "sent", "delivered"],
                failed: ["accepted", "sent"],
              };
              if (predecessors[status.status]) {
                const known = await prisma.delivery.findFirst({
                  where: {
                    workspaceId: connection.workspaceId,
                    providerId: status.id,
                  },
                  select: { id: true },
                });
                assert(
                  known,
                  "Send response not persisted yet; retry this callback.",
                  503,
                );
                await prisma.delivery.updateMany({
                  where: {
                    workspaceId: connection.workspaceId,
                    providerId: status.id,
                    status: { in: predecessors[status.status] },
                  },
                  data: { status: status.status },
                });
              }
            }
            for (const message of value.messages || [])
              if (
                /^(stop|unsubscribe|cancel)$/i.test(
                  message.text?.body?.trim() || "",
                )
              )
                await prisma.audienceContact.updateMany({
                  where: {
                    workspaceId: connection.workspaceId,
                    channel: "whatsapp",
                    destination: `+${message.from}`,
                  },
                  data: { unsubscribedAt: new Date() },
                });
          }
        }
    } else return Response.json({ error: "Unknown provider" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
