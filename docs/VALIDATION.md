# Validation performed

Local verification completed on 27 October 2026 using Node 22, Next.js 16.4.3 and a disposable PostgreSQL 16 container.

- Production build: passed, including TypeScript and static route generation.
- Database: all three migrations applied successfully to an empty isolated database; application operations exercised against the migrated schema.
- Unit tests: 7 passed (recipient validation, roles, DLT/approval requirements, authenticated encryption, password hashing, signature/unsubscribe integrity, mocked provider request construction).
- API integration scenarios: 15 passed (authentication, origin checks, cross-tenant access, trial/verification gating, secret redaction, concurrent launch deduplication, role enforcement, consent checks at dispatch, reimport suppression, forged webhook rejection, signed receipt ordering, STOP suppression, quota transaction rollback, access revocation and suspension/logout).
- Browser tests: desktop Chromium and a mobile Chromium viewport both passed. Exercised registration, dashboard, channel dialogs, keyboard dismissal, audience creation, navigation and document overflow checks. Screenshots visually inspected.
- Dependency audit: zero known advisories reported by npm audit for the final lockfile.
- `git diff --check`: passed.

Tests used fake credentials and never sent real messages or created paid subscriptions. Provider requests were mocked in unit tests. The worker integration test suppressed recipients before dispatch. No existing application database was modified.

Not validated: live MSG91/Meta/Resend credentials or delivery, Razorpay merchant approval/real recurring payments, production migration of existing data, full accessibility conformance, capacity/load behavior, disaster recovery, independent security review or legal compliance. See ARCHITECTURE.md for launch gates.
