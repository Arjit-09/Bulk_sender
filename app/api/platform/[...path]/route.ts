import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  failure,
  manager,
  rateLimit,
  sameOrigin,
  session,
} from "@/lib/platform/auth";
import { encrypt } from "@/lib/platform/crypto";
import {
  assert,
  channel,
  destination,
  dispatchEligibility,
  field,
  PLANS,
} from "@/lib/platform/policy";
import {catalog,entitlement,verifyBillingPlan} from "@/lib/platform/pricing";
type Context = { params: Promise<{ path: string[] }> };
export async function GET(_req: Request, ctx: Context) {
  try {
    const s = await session();
    const { path } = await ctx.params;
    const where = { workspaceId: s.workspaceId };
    if (path[0] === "overview") {
      const [
        contacts,
        campaigns,
        templates,
        connections,
        deliveries,
        members,
        audit,
        usage,
      ] = await Promise.all([
        prisma.audienceContact.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
        prisma.broadcast.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { _count: { select: { deliveries: true } } },
        }),
        prisma.blueprint.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.channelConnection.findMany({
          where,
          select: {
            id: true,
            channel: true,
            sender: true,
            entityId: true,
            status: true,
          },
        }),
        prisma.delivery.groupBy({
          by: ["status", "channel"],
          where,
          _count: true,
        }),
        prisma.membership.findMany({
          where,
          select: {
            id: true,
            role: true,
            account: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.auditEvent.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        prisma.usagePeriod.findUnique({
          where: {
            workspaceId_month: {
              workspaceId: s.workspaceId,
              month: new Date().toISOString().slice(0, 7),
            },
          },
        }),
      ]);
      return Response.json({
        account: {
          id: s.account.id,
          name: s.account.name,
          email: s.account.email,
          superAdmin: s.account.superAdmin,
        },
        workspace: s.workspace,
        role: s.role,
        contacts,
        campaigns,
        templates,
        connections,
        deliveries,
        members,
        audit,
        usage,
        plans: await catalog(),
        currentPlan: await entitlement(s.workspace),
      });
    }
    if (path[0] === "admin") {
      assert(
        s.account.superAdmin,
        "Platform administrator access required.",
        403,
      );
      return Response.json(
        await prisma.workspace.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { _count: { select: { members: true, campaigns: true } } },
        }),
      );
    }
    if (path[0] === "messages")
      return Response.json(
        await prisma.delivery.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            channel: true,
            destination: true,
            content: true,
            status: true,
            error: true,
            createdAt: true,
            campaign: { select: { name: true } },
          },
        }),
      );
    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: Request, ctx: Context) {
  try {
    sameOrigin(req);
    const s = await session();
    await rateLimit(`mutation:${s.account.id}`, 60);
    const { path } = await ctx.params;
    const data = await req.json();
    const workspaceId = s.workspaceId;
    const audit = (action: string, detail: string) =>
      prisma.auditEvent.create({
        data: { workspaceId, actorId: s.account.id, action, detail },
      });
    if (path[0] === "contacts") {
      const kind = channel(data.channel);
      const source = field(data.consentSource, "Consent evidence", 500);
      const contact = await prisma.audienceContact.upsert({
        where: {
          workspaceId_channel_destination: {
            workspaceId,
            channel: kind,
            destination: destination(data.destination, kind),
          },
        },
        create: {
          workspaceId,
          channel: kind,
          destination: destination(data.destination, kind),
          name: field(data.name, "Name"),
          consentSource: source,
          consentAt: new Date(),
        },
        update: { name: field(data.name, "Name") },
      });
      await audit("contact.saved", contact.id);
      return Response.json(contact);
    }
    if (path[0] === "suppress") {
      const result = await prisma.audienceContact.updateMany({
        where: { id: field(data.id, "Contact"), workspaceId },
        data: { unsubscribedAt: new Date() },
      });
      assert(result.count, "Contact not found.", 404);
      await audit("contact.suppressed", data.id);
      return Response.json({ ok: true });
    }
    if (path[0] === "templates") {
      const kind = channel(data.channel);
      const content = field(data.content, "Content", 5000);
      assert(
        !content.includes("{{"),
        "This release supports fixed-content templates only.",
      );
      const item = await prisma.blueprint.create({
        data: {
          workspaceId,
          name: field(data.name, "Template name"),
          channel: kind,
          content,
          subject: kind === "email" ? field(data.subject, "Subject") : null,
          providerTemplateId: data.providerTemplateId
            ? field(data.providerTemplateId, "Provider template reference")
            : null,
          dltTemplateId:
            kind === "sms"
              ? field(data.dltTemplateId, "DLT template ID")
              : null,
          language: data.language
            ? field(data.language, "Language", 20)
            : "en_US",
          approval: kind === "email" ? "approved" : "draft",
        },
      });
      await audit("template.created", item.id);
      return Response.json(item);
    }
    if (path[0] === "campaigns") {
      const template = await prisma.blueprint.findFirst({
        where: { id: field(data.templateId, "Template"), workspaceId },
      });
      assert(template, "Template not found.", 404);
      const scheduled = data.scheduledAt ? new Date(data.scheduledAt) : null;
      assert(
        !scheduled ||
          (Number.isFinite(scheduled.getTime()) && scheduled > new Date()),
        "Schedule must be in the future.",
      );
      const item = await prisma.broadcast.create({
        data: {
          workspaceId,
          name: field(data.name, "Campaign name"),
          channel: template.channel,
          templateId: template.id,
          scheduledAt: scheduled,
        },
      });
      await audit("campaign.created", item.id);
      return Response.json(item);
    }
    if (path[0] === "launch") {
      manager(s.role);
      const campaignId = field(data.id, "Campaign");
      const result = await prisma.$transaction(
        async (tx) => {
          const campaign = await tx.broadcast.findFirst({
            where: { id: campaignId, workspaceId },
          });
          assert(campaign, "Campaign not found.", 404);
          assert(
            campaign.status === "draft",
            "This campaign has already been queued.",
            409,
          );
          const workspace = await tx.workspace.findUniqueOrThrow({
            where: { id: workspaceId },
          });
          assert(
            workspace.subscriptionStatus === "active" &&
              workspace.billingThrough &&
              workspace.billingThrough > new Date(),
            "An active paid subscription is required to send.",
          );
          const template = await tx.blueprint.findFirst({
            where: { id: campaign.templateId, workspaceId },
          });
          assert(template, "Template not found.");
          const connection = await tx.channelConnection.findUnique({
            where: {
              workspaceId_channel: { workspaceId, channel: campaign.channel },
            },
          });
          dispatchEligibility(connection, template);
          const contacts = await tx.audienceContact.findMany({
            where: {
              workspaceId,
              channel: campaign.channel,
              unsubscribedAt: null,
            },
            take: 10001,
          });
          if (campaign.channel === "sms")
            assert(
              contacts.every((c) => /^\+91[6-9]\d{9}$/.test(c.destination)),
              "The India SMS route only accepts Indian mobile numbers.",
            );
          assert(
            contacts.length && contacts.length <= 10000,
            "A campaign needs 1–10,000 opted-in contacts.",
          );
          const month = new Date().toISOString().slice(0, 7);
          const usage = await tx.usagePeriod.upsert({
            where: { workspaceId_month: { workspaceId, month } },
            create: { workspaceId, month, reserved: contacts.length },
            update: { reserved: { increment: contacts.length } },
          });
          assert(
            usage.reserved <= (await entitlement(workspace)).limit,
            "Your monthly dispatch allowance would be exceeded.",
          );
          await tx.delivery.createMany({
            data: contacts.map((c) => ({
              workspaceId,
              campaignId,
              contactId: c.id,
              destination: c.destination,
              channel: campaign.channel,
              content: template.content,
              subject: template.subject,
              templateRef: template.providerTemplateId,
              language: template.language,
              availableAt: campaign.scheduledAt || new Date(),
            })),
          });
          await tx.broadcast.update({
            where: { id: campaign.id },
            data: { status: campaign.scheduledAt ? "scheduled" : "queued" },
          });
          await tx.auditEvent.create({
            data: {
              workspaceId,
              actorId: s.account.id,
              action: "campaign.queued",
              detail: `${campaign.id}: ${contacts.length} recipients`,
            },
          });
          return { queued: contacts.length };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return Response.json(result);
    }
    if (path[0] === "connections") {
      manager(s.role);
      const kind = channel(data.channel);
      const sender = field(data.sender, "Sender");
      if (kind === "sms")
        assert(
          /^[A-Za-z0-9]{3,11}$/.test(sender) &&
            /^\d{5,30}$/.test(String(data.entityId)),
          "Enter a valid registered header and DLT entity ID.",
        );
      if (kind === "whatsapp")
        assert(
          /^\d+$/.test(sender),
          "Enter the Meta phone number ID, not a phone number.",
        );
      if (kind === "email")
        assert(
          /^[^\r\n]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(sender),
          "Use Organization <mail@verified-domain.com>.",
        );
      const values = {
        sender,
        encryptedSecret: encrypt(field(data.secret, "Provider API key", 4000)),
        entityId: data.entityId ? field(data.entityId, "DLT entity ID") : null,
        status: "pending",
      };
      await prisma.channelConnection.upsert({
        where: { workspaceId_channel: { workspaceId, channel: kind } },
        create: { workspaceId, channel: kind, ...values },
        update: values,
      });
      await audit("connection.submitted", kind);
      return Response.json({ ok: true });
    }
    if (path[0] === "members") {
      manager(s.role);
      const email = field(data.email, "Email").toLowerCase();
      assert(
        ["admin", "member"].includes(data.role),
        "Choose admin or member.",
      );
      if (data.role === "admin")
        assert(s.role === "owner", "Only owners may appoint admins.", 403);
      await prisma.$transaction(
        async (tx) => {
          const account = await tx.account.findUnique({ where: { email } });
          assert(account, "The teammate must create an account first.");
          assert(
            !(await tx.membership.findUnique({
              where: {
                accountId_workspaceId: { accountId: account.id, workspaceId },
              },
            })),
            "This person is already a member.",
          );
          assert(
            (await tx.membership.count({ where: { workspaceId } })) <
              (await entitlement(s.workspace)).seats,
            "Your plan’s seat limit has been reached.",
          );
          await tx.membership.create({
            data: { workspaceId, accountId: account.id, role: data.role },
          });
          await tx.auditEvent.create({
            data: {
              workspaceId,
              actorId: s.account.id,
              action: "member.added",
              detail: email,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return Response.json({ ok: true });
    }
    if (path[0] === "revoke-member") {
      manager(s.role);
      const member = await prisma.membership.findFirst({
        where: { id: field(data.id, "Member"), workspaceId },
      });
      assert(member, "Member not found.", 404);
      assert(member.role !== "owner", "The owner cannot be removed.", 403);
      assert(
        s.role === "owner" || member.role === "member",
        "Only the owner can remove an admin.",
        403,
      );
      await prisma.$transaction(async (tx) => {
        await tx.membership.delete({ where: { id: member.id } });
        await tx.session.deleteMany({
          where: { accountId: member.accountId, workspaceId },
        });
        await tx.auditEvent.create({
          data: {
            workspaceId,
            actorId: s.account.id,
            action: "member.revoked",
            detail: member.accountId,
          },
        });
      });
      return Response.json({ ok: true });
    }
    if (path[0] === "switch") {
      const target = field(data.workspaceId, "Workspace");
      assert(
        await prisma.membership.findUnique({
          where: {
            accountId_workspaceId: {
              accountId: s.account.id,
              workspaceId: target,
            },
          },
        }),
        "No access to this workspace.",
        403,
      );
      const { cookies } = await import("next/headers");
      const { hash } = await import("@/lib/platform/crypto");
      const token = (await cookies()).get("pulse_session")!.value;
      await prisma.session.update({
        where: { tokenHash: hash(token) },
        data: { workspaceId: target },
      });
      return Response.json({ ok: true });
    }
    if (path[0] === "admin") {
      assert(
        s.account.superAdmin,
        "Platform administrator access required.",
        403,
      );
      const target = field(data.workspaceId, "Workspace");
      await prisma.$transaction(async (tx) => {
        if (data.action === "suspend" || data.action === "restore")
          await tx.workspace.update({
            where: { id: target },
            data: { suspended: data.action === "suspend" },
          });
        else if (data.action === "verify") {
          const result = await tx.channelConnection.updateMany({
            where: { workspaceId: target, channel: channel(data.channel) },
            data: { status: "verified" },
          });
          assert(result.count, "Connection not found.");
        } else if (data.action === "approve-template") {
          const result = await tx.blueprint.updateMany({
            where: {
              workspaceId: target,
              id: field(data.templateId, "Template ID"),
            },
            data: { approval: "approved" },
          });
          assert(result.count, "Template not found.");
        } else assert(false, "Unknown administrative action.");
        await tx.auditEvent.create({
          data: {
            workspaceId: target,
            actorId: s.account.id,
            action: `admin.${data.action}`,
            detail: field(data.reason, "Verification evidence or reason", 500),
          },
        });
      });
      return Response.json({ ok: true });
    }
    if (path[0] === "checkout") {
      assert(
        s.role === "owner",
        "Only the workspace owner may manage billing.",
        403,
      );
      assert(Object.hasOwn(PLANS, data.plan), "Unknown plan.");
      assert(
        !s.workspace.subscriptionId,
        "A subscription already exists. Contact support to change or cancel it.",
      );
      const selectedPlan = (await catalog())[data.plan];
      assert((data.versionId || null) === (selectedPlan.versionId || null), "Pricing changed. Refresh the page and review the new price.", 409);
      const planId = selectedPlan.razorpayPlanId || process.env[`RAZORPAY_PLAN_${String(data.plan).toUpperCase()}`];
      assert(
        planId &&
          process.env.RAZORPAY_KEY_ID &&
          process.env.RAZORPAY_KEY_SECRET,
        "Billing is not configured yet.",
        503,
      );
      await verifyBillingPlan(planId, Math.round(selectedPlan.price * 100));
      // Lock locally before calling a non-idempotent subscription API. Reconcile ambiguous responses manually.
      const marker = `pending_${crypto.randomUUID()}`;
      const locked = await prisma.workspace.updateMany({
        where: { id: workspaceId, subscriptionId: null },
        data: { subscriptionId: marker, planVersionId: selectedPlan.versionId || null },
      });
      assert(
        locked.count,
        "A subscription request is already in progress.",
        409,
      );
      const response = await fetch(
        "https://api.razorpay.com/v1/subscriptions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
          },
          body: JSON.stringify({
            plan_id: planId,
            total_count: 120,
            customer_notify: 1,
            notes: { workspaceId, plan: data.plan },
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      assert(
        response.ok,
        "Subscription creation needs support review. No plan was activated.",
        502,
      );
      const subscription = await response.json();
      assert(
        subscription.id && subscription.short_url,
        "Unexpected billing response.",
        502,
      );
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { subscriptionId: subscription.id },
      });
      await audit("billing.checkout_created", subscription.id);
      return Response.json({ url: subscription.short_url });
    }
    return Response.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return failure(error);
  }
}
