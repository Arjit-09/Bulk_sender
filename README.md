# Pulse Connect

A Next.js/PostgreSQL SaaS release candidate for consent-based WhatsApp, email and India SMS campaigns. Includes a responsive workspace UI, sessions, tenant-scoped APIs, roles, encrypted channel credentials, campaign drafts/schedules, an outbox worker, subscription checkout and super-admin controls.

**Status:** implementation and local testing; not publicly deployed or connected to live billing/messaging. See [architecture and launch gates](docs/ARCHITECTURE.md) before serving customers.

## Local setup

Requires Node 22+, npm and PostgreSQL 16+.

```bash
npm ci
cp .env.example .env
# Configure DATABASE_URL, APP_URL, ENCRYPTION_KEY and WORKER_SECRET.
# Generate each random secret separately:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run db:deploy
npm run dev
```

Prisma reads `.env`; Next.js reads it too. Standalone worker/admin scripts need the variables exported, or run `node --env-file=.env scripts/worker.mjs` / `node --env-file=.env scripts/promote-admin.cjs operator@example.com`.

Set `ALLOW_SIGNUP=true` temporarily for controlled onboarding. Register at `/login`, then grant the chosen operator super-admin access from a trusted shell:

```bash
node --env-file=.env scripts/promote-admin.cjs operator@example.com
```

Keep signup closed until identity verification and recovery have been commissioned. Never grant super-admin rights through a public API. Existing teammates can be added under **Team & access** and switch with a workspace ID in **Workspace**.

## Existing database migration

Back up and test restoration before migrating an existing database. Both migrations are additive relative to the existing legacy schema; legacy data is preserved but not accessible through the new workspace UI.

For a **fresh database**, run `npm run db:deploy`.

For a database already containing the original tables, first verify that its schema exactly matches the baseline migration (including indexes/constraints). Only then mark the baseline as applied:

```bash
npx prisma migrate resolve --applied 202610270001_legacy_baseline
npm run db:deploy
```

Do not run the baseline SQL against existing tables, and do not mark a mismatched schema as applied. No production migration was run during implementation. Legacy public send/webhook endpoints now return 410; review Telnyx inbound continuity before replacing an existing deployment.

## Provider and subscription setup

1. Create client-owned Meta, Resend or MSG91 accounts and configure the respective provider requirements. SMS requires DLT registration and correct entity/header/template mapping in MSG91.
2. Add encrypted credentials under **Channels**. The platform operator verifies provider records and records evidence through **Super admin**.
3. Create fixed-content templates. For SMS, enter both the MSG91 template ID and DLT template ID; for WhatsApp, use the approved Meta template name/language. Operator approval is mandatory for both.
4. Configure monthly INR Razorpay plans to match `lib/platform/policy.ts` and set the environment plan IDs. The browser redirects to hosted checkout; only verified subscription webhooks activate sending.
5. Configure callbacks: `/api/hooks/meta` (GET verification and POST messages/status), `/api/hooks/razorpay` (POST subscription events). Use independent webhook secrets. Meta must send events for every connected business phone number.
6. Run the worker as a separate supervised service. It POSTs to `/api/worker` with a bearer secret. Without it campaigns stay queued.

```bash
npm run build
npm start
# In a separate environment/process with the same configuration:
node --env-file=.env scripts/worker.mjs
```

The proposed software plans are ₹999 / ₹2,499 / ₹6,999 per month. Provider charges and taxes are separate; no fictitious provider rates or balance deductions are used. Trial accounts can prepare drafts but cannot send.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm audit
```

API integration tests require an **isolated disposable PostgreSQL database**, applied migrations, and a running application with `ALLOW_SIGNUP=true`, matching `APP_URL`/`TEST_BASE_URL`, a 64-hex-character `ENCRYPTION_KEY`, test `META_APP_SECRET` / `RAZORPAY_WEBHOOK_SECRET`, and `WORKER_SECRET`. Never run these against production.

```bash
TEST_BASE_URL=http://localhost:3100 npm run test:integration
npx playwright install chromium
TEST_BASE_URL=http://localhost:3100 npm run test:browser
```

The integration suite uses fake provider keys, suppresses queued recipients before processing, and makes no external messaging/payment calls. Browser tests create test workspaces in the disposable database. The test container can be removed after verification.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data flow, role boundaries, billing semantics, India sender identity, intentional limits and remaining production launch work.
