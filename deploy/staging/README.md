# Isolated Social-Media staging on existing Ubuntu VPS

This directory defines a separate Compose project named `social-media-staging`. It does **not** belong to relayWA, FieldPulse, or any other application. Never run `docker compose down -v`, global prune, or a global service restart.

## Preflight gate (read-only)

1. Confirm >= 2 GiB available memory and >= 8 GiB free disk, a low load average, and healthy existing Docker containers.
2. Record existing ports using `ss -lntup`; reject deployment if 127.0.0.1 ports **24601/24602** are taken.
3. Confirm no Docker container, volume, or Compose project already uses `social-media-staging`.
4. Verify existing public 80/443 ownership and reverse-proxy configuration. No existing reverse proxy reload/change is permitted without independent, non-disruptive route approval.
5. Resolve cPanel DNS management separately. `businessos.af` uses a different public IP from this VPS. DNS and HTTPS for `socials.businessos.af` are NOT implied by Compose.

## Build and private deployment

Use GitHub CI for validation. On the VPS clone only the reviewed, validated commit into a unique `/opt/social-media-staging` path, never a directory owned by another app. Do not run globally scoped Docker maintenance.

From the isolated Git checkout:

```bash
cp deploy/staging/.env.staging.example deploy/staging/.env.staging
# Replace EVERY REPLACE... value with independently generated secrets.
# Ensure the password inside each URL matches its corresponding variable.
chmod 600 deploy/staging/.env.staging
docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml config --quiet
# Preferred: use the prebuilt image from a validated GitHub staging prerelease.
# For the merged commit, obtain its 12-character SHA prefix from GitHub.
# Replace SHA12 with the exact prefix; never use a guessed artifact.
# curl -fsSL "https://github.com/Haider-Shakoori/Social-Media/releases/download/social-staging-SHA12/social-media-staging-image.tar.zst" \\
#   | zstd -dc | docker load
# If unavailable, DO NOT start a resource-intensive VPS build without a new capacity check.
docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml up -d postgres redis mailpit
docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml run --rm api pnpm --filter @social/api db:migrate:deploy
docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml up -d api web worker
```

Builds can briefly use much more than the runtime memory limit. On this constrained VPS **do not build locally**. Pull the image built and packaged by GitHub Actions after CI passes, and verify the imported tag with `docker image inspect social-media-staging/app:local` before continuing. Do not build if free disk or memory headroom is unsafe.

## Runtime safety

- Frontend: `127.0.0.1:24601` only.
- API: `127.0.0.1:24602` only. Public API path: `/api/v1/`.
- PostgreSQL, Redis and Mailpit have **zero published ports** and unique volumes/network.
- Controlled staging signup on; email verification is bypassed **only** when `EMAIL_VERIFICATION_REQUIRED=false` is explicitly set. New users are signed in immediately; no live social publishing, paid provider API connections, remote AI generation, reminder scheduling, CMS publishing, or public indexing.
- No payment provider enabled. The only pilot network UI is Meta (Facebook/Instagram) and X. Both **live OAuth disabled** until credentials and cost review; all other providers deferred.
- Email stays in private Mailpit for password resets and invitations during testing; new client signup does not send verification messages. Mailpit is not public email delivery. Password resets/invites will not reach public users until real SMTP is configured.
- In future, route HTTPS through a domain-specific, explicitly reviewed reverse proxy that serves `/api/v1/` to port 24602 and all other paths to 24601. The proxy must preserve Host, request identity, HTTPS scheme and Set-Cookie. A separate pre-existing Caddy already holds public 443; do not override it.
- Back up PostgreSQL and Redis separately; never copy live project secrets or data.

## Local checks (private)

```bash
curl -fsS http://127.0.0.1:24602/api/v1/health
curl -fsSI http://127.0.0.1:24601/
docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml ps
```

Verify the staging instant-signup flow against the live HTTPS route; keep the verified-email path covered in regular CI for other deployments. Never mistake GitHub unit/E2E or local health checks for live-domain verification.

## Rollback

Stop ONLY the `social-media-staging` Compose project, preserving volumes. Do not remove or restart any unrelated containers, sites, DNS zones, Docker images or services.

## Client Meta OAuth onboarding (pilot)

The account-connection screen now asks users to select an organization workspace and brand before authorizing an eligible Facebook Page or Instagram professional account. The OAuth callback returns to that exact context. Developer credentials are NOT bundled: until a valid approved Meta Developer App, its callback URL, access scopes, encryption key and operator testing policy are configured, the authorization button stays disabled. X remains manual-only; automatic publishing remains globally disabled. Do not enable paid X APIs or Meta publishing as part of client-linking rollout.
