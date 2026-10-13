# Social-Media SaaS Delivery Plan

## Scope and status (October 14, 2026)
- Repository: `Haider-Shakoori/Social-Media`
- Selected stack: NestJS 12, Next.js 16, React 19, PostgreSQL 17, Prisma, Redis 8, BullMQ, pnpm, Docker Compose.
- ONE public marketing website, ONE tenant/agency workspace, ONE protected platform-super-admin.
- **Current pilot: Facebook Pages, Instagram professional accounts and X (Twitter) only.** Threads, Pinterest, LinkedIn, TikTok, YouTube, Google Business Profile and Reddit are postponed to later phases.
- Commercial automatic publishing: **official, permitted APIs only**, after testing the precise platform, app, permissions, account type, formats, quotas and approved use case.
- Every unsupported capability: honest "not available / manual export" state. Experimental session connectors are separately isolated, disabled by default, and never substitutes for authorization or paid API access.
- Branches for batches 01-07 have code and CI checks, but PRs are not merged into `main` or deployed. GitHub PR checks do not replace production acceptance.
- VPS deployment **not authorized**. External developer apps, paid API access and live social publishing **not configured**.

## Stage A — Core platform (Batches 01–19)
These are the original 19 planned batches, retained so earlier milestones and PR references do not change.

| Batch | Main deliverable | State |
|---|---|---|
| 01 | Repository bootstrap, docs, health API, infrastructure, CI | Implemented on PR #1; unmerged |
| 02 | Reusable design system and public marketing site | Implemented on PR #2; unmerged |
| 03 | Authentication, tenant schema, authorization, isolation tests | Implemented on PR #3; unmerged |
| 04 | Workspaces, teams, multilingual brand profiles and onboarding | Implemented on PR #4; unmerged |
| 05 | Subscription plans, trials, quotas, offline billing | Implemented on PR #5; unmerged |
| 06 | Platform super-admin modules and website CMS | Implemented on PR #7; unmerged |
| 07 | Ten-provider catalog, policy controls, scoped manual export and worker protection | Implemented on Batch 7 PR; unmerged |
| 08 | Meta (Facebook Pages/Instagram) and X OAuth pilot, encrypted credentials and permission gates; no public posting | In progress |
| 09 | Quota-limited Cloudflare AI and deterministic branded templates | Planned |
| 10 | Content editor, media library, campaigns and immutable versions | Planned |
| 11 | Calendar and validated natural-language recurrence | Planned |
| 12 | Email/in-app approval, revocation, immutable audit | Planned |
| 13 | Independent notification center with email/in-app delivery and optional approved WhatsApp Business API | Planned |
| 14 | Durable scheduled publishing, idempotency, reconciliation | Planned |
| 15 | Account Protection Center, pause/restriction/kill switches | Planned |
| 16 | Evidence-based analytics limited to real API rights | Planned |
| 17 | Agency collaboration, client approval roles and reporting | Planned |
| 18 | Multilingual/RTL CMS, SEO and accessibility | Planned |
| 19 | Core-platform security, performance and **core-release** readiness | Planned |

Stage A release readiness is **not** a statement that all later provider adapters are complete. Multi-provider expansion is deferred until the Meta/X pilot is evaluated. The release of any new provider is an independent gated milestone.

## Stage B — Additional official-provider integrations (Batches 20–27)
Eight independently budgeted, testable implementations; provider order below prioritizes potentially accessible APIs before explicitly cost/contract-gated networks.

| Batch | Provider | Required deliverables | Release gate and fallback |
|---|---|---|---|
| 20 | **Threads** | Meta Threads OAuth, account discovery, text/image/video containers, publishing, status/reconciliation, metrics as permitted | Approved app and scopes; manual export if unavailable |
| 21 | **Pinterest** | OAuth, board selection, image/video Pins where eligible, link/alt text, upload status, analytics as available | App access, approved usage, format and quota checks; manual Pin pack |
| 22 | **LinkedIn** | Member/organization OAuth, Posts API, assets, page roles, error handling, visibility and reporting | Verify member vs organization scopes and any restricted permissions; manual post |
| 23 | **TikTok** | Creator consent/creator_info, direct photo/video posting, privacy controls, processing/publish status | Content Posting API app, `video.publish` scope approval and audit; unaudited uploads are private; manual export |
| 24 | **YouTube** | Channel OAuth, resumable video upload, metadata, thumbnail where permitted, visibility, processing and retry/reconcile | Appropriate Google OAuth/API verification, video quota and project audit for public uploads; manual video package |
| 25 | **Google Business Profile** | Eligible location selection, authorized Local Posts (update/event/offer/CTA), validation and status | Approved Google Cloud project and location access; distinguish Local Posts from other social posts; manual assets |
| 26 | **X (Twitter) advanced** | Optional X media support, improved quota/budget tracking and analytics after the Batch 8 connection pilot | Requires separate metered API approval; defer until pilot proves useful |
| 27 | **Reddit** | Authorized subreddit selection, rules checks, submission flow/moderation statuses if commercially approved | **Written commercial authorization/contract** and developer review before API publication; otherwise manual only |

Each integration batch produces **useful offline/mock implementations even without credentials**: a provider adapter with deterministic contract tests, account/format capability UI, secure disabled-by-default feature flags, user instructions, correct export package and clear status. A mock passing CI is NOT sufficient to mark production publishing available.

## Platform capabilities and product requirements
See [Platform Integration Plan](PLATFORM-INTEGRATION-PLAN.md) for precise per-provider dependencies, allowed features, blockers, required tests and source links.

### One common tenant experience
- Connected platforms visible through one **network-by-network matrix**: `planned`, `manual_only`, `awaiting_approval`, `testing`, `production_ready`, `restricted`, `disabled`.
- No sign-in using social passwords. OAuth consent and server-side encrypted scoped tokens where permitted.
- Content/media compatibility checks **before** a post can be queued; approved content version cannot change after approval without reapproval.
- Per-network local timezone scheduling (scheduled locally on the VPS if no provider-side scheduling is available), strict tenant quotas, durable BullMQ jobs, idempotency and reconciliation.
- Never imply every network has the same content types, analytics, deletion, editing, drafts, comments, stories/reels/shorts or scheduling features. Expose only real, authorized capabilities.
- Production publish must fail closed on missing API rights, expired tokens, budget limits, missing approval, archiving/suspension or policy restrictions.
- Network analytics must include source timestamps, permissions and metric definitions; no fabricated data.

### Cost containment
The core platform stays on the existing VPS. No third-party paid aggregation is required by design. **Provider API fees are not included in a VPS-only budget**. If an official API is paid, contract-restricted, audited or not approved, keep its live connector OFF and deliver an explicit manual fallback. Do not silently charge the operator, assume a free tier is unlimited or replace a gated integration with unapproved browser automation.

## Cross-batch dependencies
- Batch 07 capability registry and permission enforcement are prerequisites for all provider adapters.
- Batch 08 establishes the production authorized OAuth/credentials pattern for Meta where applicable; Batch 20 is a separate Threads OAuth/use-case review.
- Batches 10–12 supply the editor, media transforms and immutable approvals.
- Batch 14 provides scheduler, job idempotency and target reconciliation used by all auto-publish implementations.
- Batch 15 account protection and Batch 16 metrics foundation should be reused by each later adapter.
- Engineering can build mock adapters early, but live publishing has to wait for dependency checks and external approvals.

## Definition of done for EVERY batch
1. Complete functional specification with supported types/accounts, rejected types and status labels; no fictional API capability.
2. Typecheck, unit, integration and negative-permission tests pass in CI; real sandbox/authorized account testing ONLY when access exists.
3. OAuth/state/PKCE where appropriate; secrets/token encryption, refresh/revoke, least-privilege roles, tenant isolation.
4. Approval version checks, entitlement quotas, rate-limit/backoff rules, safe retries and duplicate-publish reconciliation.
5. No publishing action when an authorization, provider review, quota, terms, media validation or budget check fails.
6. Document verified provider access, actual costs, errors, manual fallback, operational kill switch and rollback.
7. Do not promote `production_ready` based on tests or mocked provider responses alone.
8. Pull request review before merge. No deployment without explicit user authorization.

## Counts
**27 planned batches** = 19 core + 8 individual provider extensions. **7 implemented on unmerged feature PRs; 20 planned batches remain**. The future 8 providers are roadmap commitments, **not existing live integrations**.
