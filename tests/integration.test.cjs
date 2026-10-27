const { test } = require("node:test");
const assert = require("node:assert/strict");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const base = process.env.TEST_BASE_URL || "http://localhost:3100";
const prefix = `test-${Date.now()}`;
async function request(path, body, cookie, origin = base) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(body ? { "Content-Type": "application/json", Origin: origin } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return {
    status: response.status,
    data,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
async function register(suffix) {
  const r = await request("/api/auth/register", {
    email: `${prefix}-${suffix}@example.com`,
    password: "test-password-only-123",
    name: `Test ${suffix}`,
    organization: `Workspace ${suffix}`,
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const overview = await request("/api/platform/overview", null, r.cookie);
  assert.equal(overview.status, 200);
  return { cookie: r.cookie, ...overview.data };
}
test("tenant isolation, roles, billing gates, queue idempotency, consent and webhook authentication", async (t) => {
  try {
    await t.test("unauthenticated requests are rejected", async () => {
      assert.equal((await request("/api/platform/overview")).status, 401);
      assert.equal(
        (await request("/api/platform/contacts", { name: "x" })).status,
        401,
      );
    });
    const a = await register("a");
    const b = await register("b");
    await t.test("cross-origin writes are rejected", async () => {
      assert.equal(
        (
          await request(
            "/api/platform/contacts",
            { name: "x" },
            a.cookie,
            "https://evil.example",
          )
        ).status,
        403,
      );
    });
    const contact = await request(
      "/api/platform/contacts",
      {
        name: "Consenting contact",
        channel: "email",
        destination: "recipient@example.com",
        consentSource: "Integration test explicit opt-in",
      },
      a.cookie,
    );
    assert.equal(contact.status, 200);
    const template = await request(
      "/api/platform/templates",
      {
        name: "Welcome",
        channel: "email",
        subject: "Welcome",
        content: "Fixed content",
      },
      a.cookie,
    );
    assert.equal(template.status, 200);
    const campaign = await request(
      "/api/platform/campaigns",
      { name: "Test campaign", templateId: template.data.id },
      a.cookie,
    );
    assert.equal(campaign.status, 200);
    await t.test(
      "other tenants cannot read, suppress, use templates or launch campaigns",
      async () => {
        const view = await request("/api/platform/overview", null, b.cookie);
        assert.equal(view.data.contacts.length, 0);
        assert.equal(view.data.templates.length, 0);
        assert.equal(
          (
            await request(
              "/api/platform/suppress",
              { id: contact.data.id },
              b.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              "/api/platform/campaigns",
              { name: "Stolen", templateId: template.data.id },
              b.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              "/api/platform/launch",
              { id: campaign.data.id },
              b.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (await request("/api/platform/admin", null, b.cookie)).status,
          403,
        );
      },
    );
    await t.test("trial cannot dispatch", async () => {
      assert.equal(
        (
          await request(
            "/api/platform/launch",
            { id: campaign.data.id },
            a.cookie,
          )
        ).status,
        400,
      );
      assert.equal(
        await prisma.delivery.count({
          where: { campaignId: campaign.data.id },
        }),
        0,
      );
    });
    await t.test(
      "provider secrets are encrypted and omitted from API reads",
      async () => {
        const r = await request(
          "/api/platform/connections",
          {
            channel: "email",
            sender: "Test <test@example.com>",
            secret: "fake-test-key-never-send",
          },
          a.cookie,
        );
        assert.equal(r.status, 200);
        const saved = await prisma.channelConnection.findFirst({
          where: { workspaceId: a.workspace.id },
        });
        assert.notEqual(saved.encryptedSecret, "fake-test-key-never-send");
        const view = await request("/api/platform/overview", null, a.cookie);
        assert.equal(
          JSON.stringify(view.data).includes("fake-test-key"),
          false,
        );
        assert.equal(
          JSON.stringify(view.data).includes("encryptedSecret"),
          false,
        );
      },
    );
    await prisma.workspace.update({
      where: { id: a.workspace.id },
      data: {
        subscriptionStatus: "active",
        billingThrough: new Date(Date.now() + 86400000),
      },
    });
    await t.test("unverified channel still blocks sending", async () => {
      assert.equal(
        (
          await request(
            "/api/platform/launch",
            { id: campaign.data.id },
            a.cookie,
          )
        ).status,
        400,
      );
    });
    await prisma.channelConnection.updateMany({
      where: { workspaceId: a.workspace.id },
      data: { status: "verified" },
    });
    await t.test(
      "concurrent launches queue recipients exactly once",
      async () => {
        const results = await Promise.all([
          request("/api/platform/launch", { id: campaign.data.id }, a.cookie),
          request("/api/platform/launch", { id: campaign.data.id }, a.cookie),
        ]);
        assert.equal(results.filter((r) => r.status === 200).length, 1);
        assert.equal(
          await prisma.delivery.count({
            where: { campaignId: campaign.data.id },
          }),
          1,
        );
        const usage = await prisma.usagePeriod.findFirst({
          where: { workspaceId: a.workspace.id },
        });
        assert.equal(usage.reserved, 1);
      },
    );
    await t.test(
      "member cannot connect channels or launch campaigns",
      async () => {
        assert.equal(
          (
            await request(
              "/api/platform/members",
              { email: b.account.email, role: "member" },
              a.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              "/api/platform/switch",
              { workspaceId: a.workspace.id },
              b.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              "/api/platform/connections",
              { channel: "email", sender: "X <x@example.com>", secret: "bad" },
              b.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              "/api/platform/launch",
              { id: campaign.data.id },
              b.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (await request("/api/platform/checkout", { plan: "scale" }, b.cookie))
            .status,
          403,
        );
      },
    );
    await t.test(
      "unsubscribe after queueing prevents provider dispatch",
      async () => {
        assert.equal(
          (
            await request(
              "/api/platform/suppress",
              { id: contact.data.id },
              a.cookie,
            )
          ).status,
          200,
        );
        const response = await fetch(base + "/api/worker", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.WORKER_SECRET}` },
        });
        assert.equal(response.status, 200);
        const delivery = await prisma.delivery.findFirst({
          where: { campaignId: campaign.data.id },
        });
        assert.equal(delivery.status, "suppressed");
        assert.equal(delivery.providerId, null);
      },
    );
    await t.test(
      "reimport cannot silently restore withdrawn consent",
      async () => {
        await request(
          "/api/platform/contacts",
          {
            name: "Again",
            channel: "email",
            destination: "recipient@example.com",
            consentSource: "New assertion",
          },
          a.cookie,
        );
        const record = await prisma.audienceContact.findUnique({
          where: { id: contact.data.id },
        });
        assert.ok(record.unsubscribedAt);
      },
    );
    await t.test(
      "forged webhooks and unauthenticated worker fail closed",
      async () => {
        assert.equal(
          (await request("/api/hooks/meta", { entry: [] })).status,
          401,
        );
        assert.equal(
          (await request("/api/hooks/razorpay", { payload: {} })).status,
          401,
        );
        assert.equal((await request("/api/worker", {})).status, 401);
        assert.equal(
          (await request("/api/debug/test-send", { toPhone: "+919876543210" }))
            .status,
          410,
        );
        assert.equal((await request("/api/webhooks/telnyx", {})).status, 410);
      },
    );
    await t.test(
      "signed WhatsApp receipts are monotonic and STOP withdraws consent",
      async () => {
        const { createHmac } = require("node:crypto");
        await prisma.channelConnection.create({
          data: {
            workspaceId: a.workspace.id,
            channel: "whatsapp",
            sender: "123456789",
            encryptedSecret: "not-used",
            status: "verified",
          },
        });
        const wa = await prisma.audienceContact.create({
          data: {
            workspaceId: a.workspace.id,
            name: "WhatsApp test",
            destination: "+919876543210",
            channel: "whatsapp",
            consentSource: "Test consent",
            consentAt: new Date(),
          },
        });
        const delivery = await prisma.delivery.create({
          data: {
            workspaceId: a.workspace.id,
            campaignId: campaign.data.id,
            contactId: wa.id,
            destination: wa.destination,
            channel: "whatsapp",
            content: "fixed",
            language: "en_US",
            providerId: "test-wa-receipt",
            status: "accepted",
          },
        });
        async function hook(value) {
          const body = JSON.stringify({
            entry: [
              {
                changes: [
                  {
                    value: {
                      metadata: { phone_number_id: "123456789" },
                      ...value,
                    },
                  },
                ],
              },
            ],
          });
          return fetch(base + "/api/hooks/meta", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-hub-signature-256":
                "sha256=" +
                createHmac(
                  "sha256",
                  process.env.META_APP_SECRET || "integration-test-meta",
                )
                  .update(body)
                  .digest("hex"),
            },
            body,
          });
        }
        assert.equal(
          (
            await hook({
              statuses: [{ id: "test-wa-receipt", status: "delivered" }],
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await hook({
              statuses: [{ id: "test-wa-receipt", status: "sent" }],
            })
          ).status,
          200,
        );
        assert.equal(
          (await prisma.delivery.findUnique({ where: { id: delivery.id } }))
            .status,
          "delivered",
        );
        assert.equal(
          (
            await hook({
              statuses: [{ id: "not-persisted-yet", status: "delivered" }],
            })
          ).status,
          503,
        );
        assert.equal(
          (
            await hook({
              messages: [{ from: "919876543210", text: { body: "STOP" } }],
            })
          ).status,
          200,
        );
        assert.ok(
          (await prisma.audienceContact.findUnique({ where: { id: wa.id } }))
            .unsubscribedAt,
        );
      },
    );
    await t.test("quota rejection rolls back the entire launch", async () => {
      const contact2 = await request(
        "/api/platform/contacts",
        {
          name: "Second",
          channel: "email",
          destination: "second@example.com",
          consentSource: "Explicit test consent",
        },
        a.cookie,
      );
      assert.equal(contact2.status, 200);
      const draft = await request(
        "/api/platform/campaigns",
        { name: "Over quota", templateId: template.data.id },
        a.cookie,
      );
      await prisma.usagePeriod.updateMany({
        where: { workspaceId: a.workspace.id },
        data: { reserved: 10000 },
      });
      assert.equal(
        (await request("/api/platform/launch", { id: draft.data.id }, a.cookie))
          .status,
        400,
      );
      assert.equal(
        await prisma.delivery.count({ where: { campaignId: draft.data.id } }),
        0,
      );
      assert.equal(
        (await prisma.broadcast.findUnique({ where: { id: draft.data.id } }))
          .status,
        "draft",
      );
    });
    await t.test(
      "revoking a member invalidates their workspace session",
      async () => {
        const member = await prisma.membership.findFirst({
          where: {
            workspaceId: a.workspace.id,
            account: { email: b.account.email },
          },
        });
        assert.equal(
          (
            await request(
              "/api/platform/revoke-member",
              { id: member.id },
              a.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request("/api/platform/overview", null, b.cookie)).status,
          401,
        );
      },
    );
    await t.test("suspension and logout revoke access", async () => {
      await prisma.workspace.update({
        where: { id: a.workspace.id },
        data: { suspended: true },
      });
      assert.equal(
        (await request("/api/platform/overview", null, a.cookie)).status,
        403,
      );
      assert.equal(
        (await request("/api/auth/logout", {}, a.cookie)).status,
        200,
      );
      assert.equal(
        (await request("/api/platform/overview", null, a.cookie)).status,
        401,
      );
    });
  } finally {
    const accounts = await prisma.account.findMany({
      where: { email: { startsWith: prefix } },
    });
    const memberships = await prisma.membership.findMany({
      where: { accountId: { in: accounts.map((a) => a.id) } },
    });
    await prisma.workspace.deleteMany({
      where: { id: { in: memberships.map((m) => m.workspaceId) } },
    });
    await prisma.account.deleteMany({
      where: { id: { in: accounts.map((a) => a.id) } },
    });
    await prisma.$disconnect();
  }
});
