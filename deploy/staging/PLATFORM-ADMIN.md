# Staging platform administrator provisioning

This script is **manual**, never runs during startup, and is separate from normal public registration.

After deploying a GitHub-validated staging image containing `apps/api/scripts/seed-platform-admin.cjs`, generate a unique account password on the VPS, not in GitHub Actions or application logs. Use an operator-controlled address such as `admin@socials.businessos.af`. The address is marked verified for a controlled staging administrator only: SMTP deliveries are still private Mailpit.

1. Create a root-only credential file under `/root` using `umask 077` and a cryptographically random password (at least 20 characters).
2. Run `docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml exec -T -e PLATFORM_ADMIN_EMAIL -e PLATFORM_ADMIN_PASSWORD api node apps/api/scripts/seed-platform-admin.cjs` from `/opt/social-media-staging`, with both credential variables securely exported in the invoking shell. Docker Compose passes their existing environment values; do not put the password in command arguments.
3. Confirm protected `GET /api/v1/platform/operations/overview` succeeds when logged in as that account, and an anonymous request fails.
4. Retrieve the secret directly from the VPS using SSH and change the password after first sign-in. Do not commit, email, paste into CI logs, or print it in deployment transcript.

The script refuses to promote existing non-admin users and never resets an existing admin's credentials. If provisioning fails, address the cause; do not weaken role checks, bypass email verification on the public registration endpoint, or enable public registration.
