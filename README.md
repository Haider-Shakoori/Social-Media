# Social-Media — AI Social Media Management SaaS

An independent multi-tenant SaaS on the relayWA technology family: Node.js 22+, NestJS 12, Next.js 16/React 19, PostgreSQL 17, Prisma ORM, Redis 8, Tailwind 4, pnpm and Docker Compose.

## Product
1. Public marketing website with planned social network integrations and content guides.
2. Tenant customer dashboard for organization identity and workspace creation (content/AI/calendar features are future batches).
3. Platform super-admin for subscription plans, tenants, AI quota and operational controls (future batches).

## Connection strategy
Our production publishing design requires verified, authorized official social APIs. Isolated unofficial connector research remains disabled by default and cannot publish through the production queue. Unsupported networks will offer manual post export/publishing.

## Development progress
- Batch 1: Monorepo, API, database/Redis groundwork, Prisma and safe connector worker — PR #1.
- Batch 2: Responsive marketing website, pricing, guides, truthful integration pages and SEO foundations — PR #2.
- Batch 3: Registered users, verified email, hashed password/session tokens, role-scoped tenants/workspaces, schema migrations, auth UI and live CI e2e tests — PR #3.

Public signup is OFF by default. No live social publishing, payment provider or production deployment has been enabled. No changes were made to relayWA.

## Documentation
- [Local setup and beta flags](docs/SETUP.md)
- [Batch 2 marketing site](docs/BATCH-02-PUBLIC-SITE.md)
- [Batch 3 identity and security](docs/BATCH-03-IDENTITY.md)
- [Primary hybrid master prompt](docs/prompts/MASTER_HYBRID_IMPLEMENTATION.md)
- [Option A — official APIs](docs/prompts/OPTION_A_OFFICIAL_APIS.md)
- [Option B — experimental connectors](docs/prompts/OPTION_B_EXPERIMENTAL_CONNECTORS.md)
- [Architecture decisions](docs/architecture/ADR-0001-hybrid.md)
- [Development roadmap](docs/ROADMAP.md)

## Launch security gates
Verified email service; real external API permissions; rate/abuse controls; secure cookies and HTTPS; operator-reviewed legal notices; tenant isolation tests and backups; actual browser-based usability testing; subscription and production operations review. These are not substituted by a CI build.
