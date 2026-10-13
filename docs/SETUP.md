# Development setup — Batch 1 foundation upgraded

This application is independent of relayWA and has not been deployed.

Prerequisites: Node.js >=22, pnpm as declared in package.json, Docker Compose.

1. Clone this repository and enter its root.
2. Copy `.env.example` to `.env` for Docker Compose. Copy it also to `apps/api/.env` and `apps/connector-worker/.env` for app processes if launching from their package directories, and change secrets for all shared environments.
3. Start local PostgreSQL and Redis: `docker compose up -d`.
4. `pnpm install --no-frozen-lockfile`
5. `pnpm --filter @social/api db:validate`
6. `pnpm --filter @social/api db:generate`
7. After reviewing the schema, create an initial migration against the disposable local DB: `pnpm --filter @social/api db:migrate:dev --name init`. Commit generated migrations before production use.
8. `pnpm dev`. Open http://localhost:3000. API: http://localhost:4000/api/v1/health.
9. Worker is independent and stays off by default: `pnpm --filter @social/connector-worker dev` starts a non-publishing job processor only when explicitly wanted.
10. `pnpm ci` for typecheck, tests and builds. CI validates Prisma schema without a live database.

The initial Prisma schema is a starting domain model; production tenant RBAC, migrations and CRUD endpoints are later work. The connector worker deliberately rejects all publish jobs.

## Operational rules
- Do not deploy development Compose to production unchanged.
- Database and Redis ports bind to loopback only; not publicly exposed.
- Keep `.env` files, credentials, OAuth tokens and user sessions out of Git.
- The repository is currently public.
- No external platform authorization, live user connection, paid service or social publishing has been configured.
- No relayWA services or customers have been altered.
