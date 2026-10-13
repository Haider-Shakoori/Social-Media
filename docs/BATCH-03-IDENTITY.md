# Batch 3 — Tenant identity, security and workspace foundation

## Delivered
- Prisma identity models and first full schema migration.
- Email/password registration and verification tokens that expire after 24 hours.
- Password reset with 1-hour single-use tokens and revocation of all prior sessions.
- Password hashes: Node.js scrypt with unique salt; no plaintext credentials.
- Opaque random 256-bit session tokens; only SHA-256 hashes stored in PostgreSQL; HttpOnly SameSite cookies; Secure for production.
- Distributed Redis authentication rate limiting (fail closed if Redis is down).
- Origin enforcement for mutating JSON API requests; intended for same-site web/API domains. Configure CORS_ORIGIN precisely; do not expose wildcard CORS or trust arbitrary forwarded IP headers.
- Account details, active session listing, revoke session and logout.
- Authenticated tenant creation with atomic OWNER membership and default workspace.
- Tenant-filtered workspace and member listing, OWNER/ADMIN workspace creation, OWNER-only role management with self-demotion/owner restrictions.
- Next.js controlled-beta signup, login, forgot/reset and verification forms; authenticated organization/workspace dashboard.
- Mailpit developer inbox and live GitHub CI services for PostgreSQL, Redis and SMTP.
- Integration tests for email, token replay, forbidden tenant access, invalid timezone, origin checks, reset and session revocation.

## Flags and safety
Server registration is OFF unless REGISTRATION_ENABLED=true. The website hides auth forms unless NEXT_PUBLIC_AUTH_ENABLED=true. Both flags must be coordinated only in a controlled test environment. Public email SMTP and legal review must be completed before commercial launch; Mailpit is development-only.

## Next batches
- User invitations and finer role-specific permissions (Batch 4).
- Workspace/brand CRUD, payment entitlements, MFA, audit logs, secure production reverse proxy and abuse monitoring.
- Cross-origin cookie deployment verification and browser security test.
- The presence of base content tables does not mean social publishing works; connector-worker still rejects publish jobs.
- No VPS deployment, shared external credentials or live connection sessions.

## Local testing
Copy .env.example to .env and also to apps/api/.env for NestJS startup. Run docker compose up -d, pnpm install, pnpm --filter @social/api db:migrate:deploy, pnpm dev. Developer Mailpit UI: http://127.0.0.1:8025. Only in a local safe test: set REGISTRATION_ENABLED=true for API, NEXT_PUBLIC_AUTH_ENABLED=true for Next.js. Validate /api/v1/health and go to /register. Run pnpm ci and use GitHub Actions for the actual database integration suite.
