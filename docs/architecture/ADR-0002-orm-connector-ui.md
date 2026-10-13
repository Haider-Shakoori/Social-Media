# ADR 0002 — Prisma, Tailwind, Connector Isolation

Date: 2026-10-13
Status: Accepted as foundation, validation pending

## Decisions
Use Prisma ORM v6 stable with a PostgreSQL model schema and NestJS lifecycle. Migrations must be generated and reviewed before deployment. Add Tailwind CSS v4 for the reusable website/customer/admin component system; retain the initial marketing stylesheet until full UI batch. BullMQ remains the queue layer; Temporal is not needed for first beta.

Keep connector-worker as a separate Node.js service with typed contracts, bounded concurrency and a conservative fail-closed behavior. In Batch 1, the worker can report unavailable capabilities but **never publishes**. Production publishing later must look up tenant-scoped permissions and immutable approved content directly from persistent records (not trust job payload booleans), then validate provider approval and reconcile remote publication.

Do not import GrowChief AGPL-covered source code. We can learn from its architecture without copying its implementation.

## Release gates
- Prisma schema validation + reviewed migration; DB connection smoke test.
- Tenant isolation and RBAC tests; account permissions must not depend on supplied IDs alone.
- Official social integration eligibility verified before production publishing.
- Experimental self-hosted sessions disabled by default and test-only where permitted.
- No VPS deployment or changes to relayWA without explicit authorization.
