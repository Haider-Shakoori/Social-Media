# Social-Media local developer setup

## Stack
Node.js 22+, pnpm 12.9.1, NestJS 12, Next.js 16, PostgreSQL 17, Redis 8, Prisma 6, Mailpit (local SMTP inbox).

## Start from the GitHub repository
1. Clone the repository and switch to the appropriate Batch 3 feature branch.
2. Copy root .env.example to .env and to apps/api/.env (and to apps/connector-worker/.env if testing the experimental workers). Do not commit copies.
3. Ensure all passwords and secrets are private for any shared environment; .env.example contains local placeholders.
4. Run docker compose up -d to start **development-only** PostgreSQL, Redis and Mailpit bound to loopback.
5. Run pnpm install --no-frozen-lockfile, then pnpm --filter @social/api db:migrate:deploy and pnpm --filter @social/api db:generate.
6. Run pnpm dev for the NestJS API and Next.js website. Use http://localhost:4000/api/v1/health and http://localhost:3000.
7. For local, controlled beta testing only: set REGISTRATION_ENABLED=true in apps/api/.env and NEXT_PUBLIC_AUTH_ENABLED=true in the environment for the Next.js build/dev server; restart both services. They are deliberately disabled by default.
8. Open http://localhost:3000/register. Registration emails are visible in Mailpit's local-only UI at http://127.0.0.1:8025. Verify your email before signing in.
9. After authentication, open /dashboard to create a tenant and additional workspace.
10. Run pnpm typecheck, pnpm test and pnpm build. GitHub CI also runs migration deploy/drift checks and real integration tests with Postgres/Redis/Mailpit.

## Important environment settings
- DATABASE_URL: dedicated PostgreSQL database, not relayWA's.
- REDIS_URL: dedicated Redis endpoint/namespace (separate Redis service in production).
- CORS_ORIGIN: exact allowed web origins; never '*'.
- WEB_BASE_URL: exact frontend origin, used in verification/reset emails.
- SMTP_HOST, SMTP_PORT, SMTP_FROM: real permitted SMTP in production, local Mailpit during testing.
- REGISTRATION_ENABLED: false in production until approval to launch.
- NEXT_PUBLIC_AUTH_ENABLED: false until frontend account pages are ready for controlled beta.
- NODE_ENV=production: makes auth cookies Secure (requires HTTPS).
- PUBLIC_INDEXING_ENABLED: disabled before public launch.

## Security and deployment
Do not deploy dev Compose directly or expose its database, Redis or Mailpit UI to the internet. Configure a trusted HTTPS reverse proxy, correct cookie site/domain behavior, secure SMTP sender, protections against abuse, log retention, backups and legal review before public signup. The app intentionally has no active social publishing; connector-worker rejects publish operations. Do not merge/deploy or change relayWA without explicit authorization.

## PR dependencies
Merge Batch 1 PR #1, then Batch 2 PR #2, then Batch 3 PR #3 after review and green GitHub CI.
