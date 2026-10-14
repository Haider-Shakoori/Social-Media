# Connector Management — administrator operations

URL: `https://socials.businessos.af/platform/connectors`. Access requires an authenticated **platform admin**, enforced by Nest's `AuthGuard` and `PlatformGuard`, not only by the frontend.

## Architecture

The dashboard requests status and queues read-only browser tests in Postgres. The isolated browser-lab worker polls via a dedicated `/api/v1/browser-lab/agent/*` control API using an independent, 64–128-character hexadecimal bearer token over TLS. The API refuses the bridge unless `BROWSER_LAB_CONTROL_ENABLED=true`. It never returns provider tokens, passwords, browser cookies or proxy credentials.

The worker remains on a separate Docker network. It makes outbound HTTPS calls to the API and dispatches a maximum of one concurrent read-only Temporal activity. Dashboard tests can only inspect `https://example.org/`, regardless of the supplied account alias. No arbitrary URL, Meta/Facebook/Instagram/X login, profile import, social publishing, CAPTCHA automation, or browser account connection is offered.

The administrator can:
- Inspect real worker heartbeat and the one-session cap.
- Add an operator-only **test label**, separate from tenants/social users.
- Assign an existing proxy **alias** shown by the worker; proxy URLs and credentials remain in the operator-mounted mapping file.
- Select Playwright or Patchright and queue **one fixed-origin read-only test** globally.
- View test results and failure codes; timed-out tests are never silently retried.

## Operator activation (only after deploying API and lab image updates)

1. Generate a cryptographically random **64+ hexadecimal-character** independent agent secret through an authorized operator shell. Never paste it into chat, GitHub or logs.
2. Place it in the private `deploy/staging/.env.staging` as `BROWSER_LAB_AGENT_TOKEN` (keep file mode 0600); set `BROWSER_LAB_CONTROL_ENABLED=true` only after the API code and SQL migration are deployed.
3. Recreate the **API container only**, with staging Compose (`docker compose --env-file deploy/staging/.env.staging -f deploy/staging/compose.yaml up -d --no-build --no-deps --force-recreate api`).
4. Recreate the experimental worker using `docker compose --env-file deploy/staging/.env.staging -f deploy/experimental/compose.yaml --profile experimental up -d --no-build --no-deps --force-recreate browser-lab`. The experimental Compose file passes only `BROWSER_LAB_AGENT_TOKEN`, not all staging secrets, to this worker.
5. Check dashboard heartbeat and execute a single harmless test with a disposable label, keeping `BROWSER_LAB_ALLOWED_ORIGINS=https://example.org`. If disabled, the worker still supports operator local-only tests.

The default staging flags for paid X APIs, Meta account connection, and publishing remain unchanged. Do **not** turn them on to activate this independent lab. Keep the lab's dedicated Temporal development server and volume private. The worker has `restart: "no"` and no public ports.

The proxy mapping file mounted at `/run/browser-lab/proxies.json` is operator managed; do not store real credentials in the repository's `example.proxy-map.json`. Configure an external read-only file using `BROWSER_LAB_PROXY_MAP_PATH` and suitable access rights for the unprivileged worker (UID 10001). Proxy aliases listed in the dashboard correspond to keys in this file, not to stored proxy addresses. The API will refuse a test if the selected alias is not present in the worker's current report.

## Rollback

Set `BROWSER_LAB_CONTROL_ENABLED=false` in the staging env and recreate API to turn the control plane off. To disable the worker bridge without changing application state, recreate the experimental worker without a token; to stop all lab infrastructure, run `docker compose -f deploy/experimental/compose.yaml --profile experimental stop`. Neither action deletes tenant data or Docker volumes. Never prune Docker globally as part of this procedure.

## Remaining limitations

Experimental Temporal server is **not production-grade**. Proxy validation is based on an operator-supplied file and does not validate third-party proxy uptime. This dashboard does not connect client social accounts; it cannot substitute for Meta OAuth/app approval or compliant provider integrations.
