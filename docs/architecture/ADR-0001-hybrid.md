# ADR 0001 — Hybrid SaaS and connector boundary
Date: 2026-10-13
Status: Accepted for initial implementation

## Decision
Use an independent application stack: Node.js 22+, NestJS 12, Next.js 16/React 19, PostgreSQL 17, Redis 8, pnpm monorepo and Docker Compose. Create ONE multi-tenant SaaS with public website, tenant app and platform super-admin. Do not copy production data from another project.

## Connector policy
Production publishing goes through permitted, authorized official APIs. Keep any unofficial connector research in an isolated, disabled-by-default test lane restricted to controlled accounts and platform permissions. A connector's ability to login is not proof of policy permission. Unsupported platforms use manual export/publish fallback.

## Cost policy
Paid VPS only initially. Use open-source dependencies, local PostgreSQL/Redis, existing SMTP where permitted, Cloudflare Workers AI only within its actual free quota, and optional approved WhatsApp Business Cloud API with email/in-app fallback. Never enable paid services automatically.

## Privacy, operational controls and acceptance
Unique tenant/workspace ownership across content, connections and logs; encrypted tokens; approval version locks; replay-safe webhooks; publish idempotency; immediate pause on permissions errors or actual restrictions; backup and restore. Super-admin controls subscriptions and integration capability flags. App review, financial settlement, security review and customer pilot gates precede a public commercial launch.

## Architecture
- apps/web: marketing + tenant UI + platform admin
- apps/api: REST API, identity, tenancy, CMS, plans, content and approval
- apps/worker: scheduled generation, notifications, analytics and publishing
- packages/shared: domain contracts
- infra: Docker Compose and deployment templates

Start as modular monolith. Extract workers only when load and availability require.
