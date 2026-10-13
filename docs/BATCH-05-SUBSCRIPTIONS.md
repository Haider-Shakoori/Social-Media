# Batch 5 — Subscription, Trials and Manual Billing

## Architecture and features
- One subscription per tenant, created atomically with each new tenant.
- Existing tenants backfilled to the 14-day trial on database migration.
- Enabled internal \`trial\` plan: 2 brands, 3 seats (including pending invitations), 2 connected accounts, 30 AI text units, 8 AI images and 24 scheduled posts per calendar month.
- Starter / Growth / Agency example plans are **disabled, private and unpriced** until a platform administrator configures them. Nothing is automatically billed.
- Read-only tenant subscription/usage/invoice/payment overview for OWNER/ADMIN; other tenants and roles cannot read private billing.
- Platform administration requires a separate \`is_platform_admin\` flag (never assigned by any public endpoint). New installations have **zero platform admins**. Provision a trusted operator manually in a secure database procedure after verifying identity, e.g. using a dedicated administrative runbook; don't include this operation in anonymous startup scripts.
- Platform-only plan create/edit (including an interactive plan editor), subscription activation/renewal, trial extension, grace/suspend/resume, manual invoice issuance, payment recording and verification/rejection. Previously recorded pending payments remain available for review after page reload.
- Plan entitlements are snapshotted at activation, preventing unannounced retroactive quota changes.
- Counting and updates are serialized by a row-level tenant subscription lock, and Prisma serializable transactions retry transient conflicts.
- Existing brand creation and team invitation operations **actually enforce** brand and seat quotas; pending invitations reserve seats.
- \`EntitlementsService.consume\` is a server-side, transaction-safe usage meter for AI_TEXT, AI_IMAGE and SCHEDULED_POST, resetting at the UTC calendar-month boundary. Future generators and schedulers must call it after validating operation idempotency; no public consumption endpoint is exposed.
- Manual records are NOT payment processing. Issuing an invoice or recording a payment does not mark it paid. Only operator verification marks matching invoice PAID, and subscription activation is a separate auditable admin decision.
- All platform financial/subscription changes are recorded in \`billing_audit_events\`.
- Dynamic expiration is enforced on each protected quota call; no cron job required to start enforcing expiry.

## Current operating scope
No financial institution / card processor is integrated. The displayed plans on the public marketing page remain 'Pricing TBA'. No real social API publishing or AI generation is active.

## Testing / security
CI applies the versioned migration to PostgreSQL 17, checks schema drift, validates types, runs unit tests, builds and exercises registration, cross-tenant isolation, seat/brand limits, simultaneous consumption, expired trials, privileged admin actions, manual invoice/payment verification, replay protection and suspension.

## Known limitations / follow-up
- Tenant usage display uses counters plus direct resource counts; connection creation and future AI/publishing flows must hook into these checks before launch.
- Invitation acceptance is also blocked when the organization's subscription is expired or suspended.
- No invoice PDFs, billing tax engine, automatic charges, payment gateway, refunds, proration or self-service paid checkout.
- Operators must verify manual payments offline and handle accounting/currency settlement carefully.
- App assumes price amounts are integers in minor units (not necessarily \`/100\` for every currency); future UI must use a currency exponent map.
- Audit retention/export, detailed seat invite behavior, plan versioning, operator MFA/step-up auth and concurrency load testing require production hardening.
- Browser accessibility/device QA and real SMTP configuration still required.
- All PRs are unmerged; no VPS changes or relayWA modifications.
