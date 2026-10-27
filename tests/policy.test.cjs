const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const policy = require("../.test-build/policy.js");
const crypto = require("../.test-build/crypto.js");
process.env.ENCRYPTION_KEY = "12".repeat(32);
test("channel-specific recipient validation and normalization", () => {
  assert.equal(
    policy.destination("Test@Example.com", "email"),
    "test@example.com",
  );
  assert.equal(
    policy.destination("+919876543210", "whatsapp"),
    "+919876543210",
  );
  for (const phone of ["9876543210", "+0000000000", "<script>"])
    assert.throws(() => policy.destination(phone, "sms"));
  assert.throws(() => policy.destination("missing-at", "email"));
  assert.throws(() => policy.channel("telegram"));
});
test("only owners and admins can manage sending", () => {
  assert.equal(policy.canManage("owner"), true);
  assert.equal(policy.canManage("admin"), true);
  assert.equal(policy.canManage("member"), false);
});
test("DLT and provider approval cannot be skipped", () => {
  const template = {
    channel: "sms",
    approval: "approved",
    providerTemplateId: "flow",
    dltTemplateId: "dlt",
  };
  assert.throws(() => policy.dispatchEligibility(null, template));
  assert.throws(() =>
    policy.dispatchEligibility(
      { status: "pending", entityId: "entity" },
      template,
    ),
  );
  assert.throws(() =>
    policy.dispatchEligibility({ status: "verified" }, template),
  );
  assert.throws(() =>
    policy.dispatchEligibility(
      { status: "verified", entityId: "entity" },
      { ...template, approval: "draft" },
    ),
  );
  assert.doesNotThrow(() =>
    policy.dispatchEligibility(
      { status: "verified", entityId: "entity" },
      template,
    ),
  );
  assert.throws(() =>
    policy.dispatchEligibility(
      { status: "verified" },
      { channel: "whatsapp", approval: "approved" },
    ),
  );
});
test("secrets are encrypted, randomized, and authenticated", () => {
  const a = crypto.encrypt("provider-secret");
  const b = crypto.encrypt("provider-secret");
  assert.notEqual(a, b);
  assert.equal(a.includes("provider-secret"), false);
  assert.equal(crypto.decrypt(a), "provider-secret");
  const parts = a.split(".");
  parts[2] = Buffer.from("tampered").toString("base64");
  assert.throws(() => crypto.decrypt(parts.join(".")));
});
test("password hashes use individual salts and reject incorrect passwords", async () => {
  const a = await crypto.passwordHash("a-long-test-password");
  const b = await crypto.passwordHash("a-long-test-password");
  assert.notEqual(a, b);
  assert.equal(await crypto.passwordMatches("a-long-test-password", a), true);
  assert.equal(await crypto.passwordMatches("wrong-password", a), false);
});
test("webhooks and unsubscribe links resist forgery", () => {
  const sig = createHmac("sha256", "secret").update("body").digest("hex");
  assert.equal(crypto.validHmac("body", sig, "secret"), true);
  assert.equal(crypto.validHmac("changed", sig, "secret"), false);
  assert.equal(crypto.validHmac("body", "bad", "secret"), false);
  const token = crypto.unsubscribeToken("contact-a");
  assert.equal(crypto.validUnsubscribe("contact-a", token), true);
  assert.equal(crypto.validUnsubscribe("contact-b", token), false);
});

test("provider adapters use registered templates and never expose fabricated delivery", async () => {
  const { deliver } = require("../.test-build/providers.js");
  const original = global.fetch;
  const calls = [];
  process.env.APP_URL = "https://test.example";
  process.env.META_GRAPH_VERSION = "v99.0";
  const connection = {
    sender: "123456",
    entityId: "entity",
    encryptedSecret: crypto.encrypt("test-key"),
  };
  const message = {
    id: "message-id",
    contactId: "contact-id",
    destination: "+919876543210",
    content: "Approved fixed content",
    subject: "Subject",
    templateRef: "approved-template",
    language: "en_US",
  };
  try {
    global.fetch = async (url, options) => {
      calls.push({ url, options, body: JSON.parse(options.body) });
      return Response.json({
        id: "email-id",
        messages: [{ id: "wa-id" }],
        type: "success",
        message: "sms-id",
      });
    };
    assert.equal(
      await deliver(
        { ...message, channel: "email" },
        { ...connection, sender: "Business <hello@example.com>" },
      ),
      "email-id",
    );
    assert.equal(calls[0].options.headers["Idempotency-Key"], "message-id");
    assert.match(calls[0].body.text, /Unsubscribe: https:\/\/test.example/);
    assert.equal(
      await deliver({ ...message, channel: "whatsapp" }, connection),
      "wa-id",
    );
    assert.equal(calls[1].body.template.name, "approved-template");
    assert.equal(calls[1].body.to, "919876543210");
    assert.equal(
      await deliver({ ...message, channel: "sms" }, connection),
      "sms-id",
    );
    assert.equal(calls[2].body.template_id, "approved-template");
    assert.equal(calls[2].options.headers.authkey, "test-key");
    await assert.rejects(() =>
      deliver(
        { ...message, channel: "sms", destination: "+14155552671" },
        connection,
      ),
    );
    global.fetch = async () =>
      Response.json({ error: "failure" }, { status: 503 });
    await assert.rejects(
      () => deliver({ ...message, channel: "email" }, connection),
      /Reconcile/,
    );
  } finally {
    global.fetch = original;
  }
});
