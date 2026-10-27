import prisma from "@/lib/prisma";
import { timingSafeEqual } from "node:crypto";
import { deliver } from "@/lib/platform/providers";
import {processSupportQueue} from "@/lib/platform/support";
export const maxDuration = 60;
export async function POST(req: Request) {
  const expected = Buffer.from(`Bearer ${process.env.WORKER_SECRET || ""}`);
  const actual = Buffer.from(req.headers.get("authorization") || "");
  if (
    !process.env.WORKER_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  // A crashed worker may have sent a message. Mark for reconciliation, never blindly resend.
  await prisma.delivery.updateMany({
    where: {
      status: "processing",
      claimedAt: { lt: new Date(Date.now() - 300000) },
    },
    data: {
      status: "unknown",
      error:
        "Worker lease expired; reconcile provider records before retrying.",
    },
  });
  let processed = 0;
  for (let i = 0; i < 2; i++) {
    const ids = await prisma.$queryRaw<
      { id: string }[]
    >`UPDATE "Delivery" SET status = 'processing', "claimedAt" = NOW() WHERE id IN (SELECT id FROM "Delivery" WHERE status = 'queued' AND "availableAt" <= NOW() ORDER BY "availableAt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id`;
    if (!ids.length) break;
    const message = await prisma.delivery.findUniqueOrThrow({
      where: { id: ids[0].id },
    });
    const [contact, connection, workspace] = await Promise.all([
      prisma.audienceContact.findFirst({
        where: { id: message.contactId, workspaceId: message.workspaceId },
      }),
      prisma.channelConnection.findUnique({
        where: {
          workspaceId_channel: {
            workspaceId: message.workspaceId,
            channel: message.channel,
          },
        },
      }),
      prisma.workspace.findUnique({ where: { id: message.workspaceId } }),
    ]);
    if (
      !contact ||
      contact.unsubscribedAt ||
      !connection ||
      connection.status !== "verified" ||
      !workspace ||
      workspace.suspended ||
      workspace.subscriptionStatus !== "active" ||
      !workspace.billingThrough ||
      workspace.billingThrough < new Date()
    ) {
      await prisma.delivery.update({
        where: { id: message.id },
        data: {
          status: "suppressed",
          error:
            "Consent, channel verification or subscription is no longer valid.",
        },
      });
    } else {
      try {
        const providerId = await deliver(message, connection);
        await prisma.delivery.update({
          where: { id: message.id },
          data: { providerId, status: "accepted" },
        });
      } catch (error) {
        await prisma.delivery.update({
          where: { id: message.id },
          data: {
            status: "unknown",
            error:
              error instanceof Error
                ? error.message.slice(0, 300)
                : "Provider result unknown",
          },
        });
      }
    }
    const outstanding = await prisma.delivery.count({
      where: {
        campaignId: message.campaignId,
        status: { in: ["queued", "processing"] },
      },
    });
    if (!outstanding)
      await prisma.broadcast.update({
        where: { id: message.campaignId },
        data: { status: "processed" },
      });
    processed++;
  }
  await prisma.rateBucket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const supportProcessed = await processSupportQueue();
  return Response.json({ processed, supportProcessed });
}
