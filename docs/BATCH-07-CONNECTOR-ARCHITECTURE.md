# Batch 7 — Universal Connector Architecture (Independent Product)

## Non-negotiable independence
This Social-Media SaaS is a fully new, standalone application. It has no dependencies on any existing messaging platform or third-party project. It owns its NestJS API, Next.js UI, Prisma/Postgres, Redis/BullMQ worker, hosting/domain and credentials. In-app and email approval systems are the defaults. Future optional WhatsApp notifications use a separately approved WhatsApp Business Cloud API app, never another project's code, sessions, tokens or infrastructure.

## Implemented
1. Shared TypeScript network union and descriptor registry for 10 networks: Instagram, Facebook Pages, Threads, Pinterest, LinkedIn, TikTok, YouTube, Google Business Profile, X and Reddit.
2. Per-provider tentative content types (NOT verified production capabilities), account requirements, planned batch, API review/cost gates and honest status messages.
3. Prisma migration creates default-off social_provider_policies, including review, cost, operator and production-verification flags. X and Reddit start manual-only, all others planned.
4. Tenant-scoped endpoints list providers without exposing tokens, and brand views require actual tenant membership and brand grants.
5. Safe server-side manual draft-package formatter: authenticated owner/admin/editor can prepare a sanitized caption, selected content type, HTTPS media references and instructions; **nothing is posted, uploaded or queued**.
6. Operator-only policy read/update with transactionally persisted audit; admin cannot set PRODUCTION_READY, apiApproved, costApproved or productionVerified via this API. Testing-state flags do not enable a live connection.
7. Tenant UI shows exact rollout status and manual export creation; platform UI shows gated provider policy registry.
8. Connector worker remains unable to publish even if a job says its network is supported. No official production adapters or credentials are registered.
9. Shared unit and HTTP integration tests enforce policy denial, cross-tenant isolation, format validation, and worker fail-closed behavior.

## Not yet implemented
- Actual Meta/Google/etc OAuth flows, callback verification, permission refresh/revocation, encrypted token persistence and scopes.
- Provider API posting, account discovery, analytics collection and media transfers.
- Scheduling with immutable approvals, idempotent delivery and reconciliation.
- Automated payment/fee authorization or purchased X/Reddit access.
These belong to provider-specific batches and scheduling/security milestones.

## API surface
- GET /api/v1/tenants/:tenantId/providers
- GET /api/v1/tenants/:tenantId/providers/workspaces/:workspaceId/brands/:brandId
- POST /api/v1/tenants/:tenantId/providers/workspaces/:workspaceId/brands/:brandId/manual-package
- GET /api/v1/platform/providers (platform admin only)
- PATCH /api/v1/platform/providers/:network (platform admin only)

## Security and release gates
No social password or session collection. Do not build platform-evasion automation. No live publish until approved official access, correct scopes and account eligibility, safely encrypted credentials, per-tenant authorization, post-version and approval checks, subscription quotas, budgets, provider policy and signed/webhook validation are all present. Every provider requires separate real-account testing and explicit release review; a green CI run or "testing" flag is insufficient. The connector worker still rejects all publishing.

## Local verification
Run root pnpm ci. GitHub Actions additionally deploys reviewed PostgreSQL migrations, checks Prisma drift and executes HTTP E2E against Postgres/Redis/Mailpit. External API calls and paid accounts are not required.

No merges, no production deployment and no changes to any other software project.
