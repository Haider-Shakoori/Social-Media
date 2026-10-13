# Social-Media — AI Social Media Management SaaS

An independent multi-tenant SaaS using its own services and infrastructure: Node.js 22+, NestJS 12, Next.js 16/React 19, PostgreSQL 17, Prisma ORM, Redis 8, Tailwind 4, pnpm and Docker Compose.

## Product
1. Public marketing website with planned social network integrations and content guides.
2. Tenant customer dashboard for organization identity and workspace creation (content/AI/calendar features are future batches).
3. Platform super-admin for subscription plans, tenant/user visibility, audited operational settings, and gated article/guide/custom-page CMS (Batch 6 branch).

## Planned platform coverage
**Pilot now: Facebook Pages, Instagram professional accounts and X (Twitter).** Threads, Pinterest, LinkedIn, TikTok, YouTube, Google Business Profile and Reddit are deferred to a future phase. The **27-batch roadmap** comprises 19 core-platform batches plus 8 individually gated provider integrations. An included network is **not** a claim of live API access. See [Provider eligibility and implementation plan](docs/PLATFORM-INTEGRATION-PLAN.md).

## Connection strategy
Our production publishing design requires verified, authorized official social APIs. Isolated unofficial connector research remains disabled by default and cannot publish through the production queue. Unsupported networks will offer manual post export/publishing.

## Development progress
- Batch 1: Monorepo, API, database/Redis groundwork, Prisma and safe connector worker — PR #1.
- Batch 2: Responsive marketing website, pricing, guides, truthful integration pages and SEO foundations — PR #2.
- Batch 3: Registered users, verified email, hashed password/session tokens, role-scoped tenants/workspaces, schema migrations, auth UI and live CI e2e tests — PR #3.
- Batch 4: Brand profiles, tenant invitations, scoped team permissions — PR #4.
- Batch 5: Trials, quotas and manual offline billing, with no active payment gateway — PR #5.
- Batch 6: Protected platform console and publication-gated CMS — PR #7 (stacked after roadmap PR #6).
- Batch 7: Ten-network typed connector catalog, tenant-scoped manual export, audited platform policy controls and fail-closed publishing worker — PR #8.
- Batch 8: Meta and X secure OAuth account-linking pilot, account selection and disconnect, with no automatic publishing — Batch 8 PR.

Public signup is OFF by default. No live social publishing, payment provider or production deployment has been enabled. No other projects or services were modified.

## Documentation
- [Local setup and beta flags](docs/SETUP.md)
- [Batch 2 marketing site](docs/BATCH-02-PUBLIC-SITE.md)
- [Batch 3 identity and security](docs/BATCH-03-IDENTITY.md)
- [Batch 6 platform super-admin and CMS](docs/BATCH-06-PLATFORM-CMS.md)
- [Primary hybrid master prompt](docs/prompts/MASTER_HYBRID_IMPLEMENTATION.md)
- [Option A — official APIs](docs/prompts/OPTION_A_OFFICIAL_APIS.md)
- [Option B — experimental connectors](docs/prompts/OPTION_B_EXPERIMENTAL_CONNECTORS.md)
- [Architecture decisions](docs/architecture/ADR-0001-hybrid.md)
- [Development roadmap — 27 batches](docs/ROADMAP.md)
- [Ten-platform integration strategy and API approval gates](docs/PLATFORM-INTEGRATION-PLAN.md)
- [Batch 7 universal connector architecture](docs/BATCH-07-CONNECTOR-ARCHITECTURE.md)
- [Batch 8 Meta/X pilot configuration](docs/BATCH-08-META-X-PILOT.md)

## Launch security gates
Verified email service; real external API permissions; rate/abuse controls; secure cookies and HTTPS; operator-reviewed legal notices; tenant isolation tests and backups; actual browser-based usability testing; subscription and production operations review. These are not substituted by a CI build.

## Accelerated Batches 09-16
AI creative templates, versioned brand content, manual calendar reminders, human approvals, independent notifications, due reconciliation, account protection and evidence-only analytics are implemented in stacked review branches. These are NOT live provider publishing integrations. See [limitations and QA](docs/BATCH-09-16-DELIVERY.md).

## Language decision
The international-market pilot is English only. Translation and RTL support are postponed until separately requested. New brand profiles, creative captions, drafts and CMS entries are English-only; historical stored records are retained without migration.
