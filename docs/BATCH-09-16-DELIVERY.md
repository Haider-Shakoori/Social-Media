# Delivery record: Batches 09-16

Project: completely independent Social-Media SaaS, with Meta Facebook Pages/Instagram professional accounts and X as the only pilot destinations. Seven other providers deferred.

## Implemented modules

| Batch | Deliverable | Current boundary |
|---|---|---|
| 9 | Deterministic branded caption templates, SVG creative cards, optional Cloudflare Workers AI text with tenant quota | Remote AI OFF unless configured; SVG is not image generation |
| 10 | Tenant-scoped content editor, campaigns, HTTPS-only media references and immutable post versions | External images are not uploaded, scanned or verified as owned |
| 11 | Future calendar manual reminders, timezone checks, daily/weekly UTC recurrences and scheduling credit limits | No natural-language parser or DST-preserving recurrence |
| 12 | Version-locked approval requests, separate reviewer approval/rejection, expiry, and audit trail | No automatic social publishing is granted by approval |
| 13 | Independent in-app inbox, approval/decision notifications, read state, opt-in user-triggered SMTP copy | Automated email queues and WhatsApp integrations not active |
| 14 | Operator-gated minute reconciler, idempotent due-state updates and human notifications | NEVER sends social content; MANUAL_DUE is not PUBLISHED |
| 15 | Default-paused brands, manager-only safety override, restricted accounts and local credential deletion | Does not revoke external Meta/X grants or enable live posting |
| 16 | Internal operational metrics by brand with 7/30/90-day daily drafts | Reach, engagement, followers and impressions explicitly unavailable |

## User interface

The authenticated tenant dashboard includes the Meta/X connector pilot, creative studio, private drafts, calendar, approval review, independent in-app notifications, pause controls and internal analytics. Brand roles are enforced by the backend; supported languages in AI input include English, Dari, Pashto and Arabic. The overall Next.js interface still requires full RTL/accessibility review in Batch 18.

## Release and security

All connectors remain fail-closed. The older connector-worker still rejects every publish job. No Meta/X developer accounts or paid access configured, no external posts or verified social insights. AI_GENERATION_ENABLED and MANUAL_REMINDER_SCHEDULER_ENABLED default to false. X spend threshold is NOT a hard billing meter; paid X production calls must stay off.

CI checks Prisma migration and schema drift, TypeScript, package tests, production builds, PostgreSQL/Redis/Mailpit HTTP E2E tests and a synthetic full content-to-approval-to-manual-due workflow. CI is not a substitute for external API acceptance, privacy/security review, load testing or actual mobile/browser accessibility QA.

Review PRs for batches 09-16 in order, stacked on Batch 08. Nothing has been deployed or merged to the main branch without separate release authorization.
