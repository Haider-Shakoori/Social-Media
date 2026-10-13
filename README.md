# Social-Media — AI Social Media Management SaaS

A new, independent multi-tenant SaaS using the same application technology family as relayWA: NestJS 12, Next.js 16/React 19, PostgreSQL 17, Redis 8, Node 22+, TypeScript and pnpm.

## Product areas
1. Public marketing website and SEO/CMS.
2. Tenant dashboard for brands, content generation, scheduling, approvals, publishing and analytics.
3. Platform super-admin for customers, subscriptions, provider settings, AI quotas, security and operations.

## Architecture choice
One shared SaaS platform with a hybrid connector architecture. **Official authorized APIs are production publishing connectors.** Unofficial session-based connector research stays isolated and disabled by default. Manual publishing is the fallback for unsupported networks.

## Start here
- [Primary hybrid master prompt](docs/prompts/MASTER_HYBRID_IMPLEMENTATION.md)
- [Option A — official API implementation prompt](docs/prompts/OPTION_A_OFFICIAL_APIS.md)
- [Option B — experimental connector implementation prompt](docs/prompts/OPTION_B_EXPERIMENTAL_CONNECTORS.md)
- [Architecture decision](docs/architecture/ADR-0001-hybrid.md)
- [Development batches](docs/ROADMAP.md)

## Safety and cost
Do not change or deploy relayWA. No live social credentials, proxy/fingerprint evasion, or paid third-party services without explicit authorization. Initially budget only for the existing VPS. Free third-party allowances have caps.

## Status
Batch 1 foundation on feature branch. No official social developer permissions or production social posting has been configured. No VPS deployment has been performed.
