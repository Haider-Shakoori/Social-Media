# Experimental browser connector lab (NOT client-ready)

This is an isolated research/testing implementation of four planned components, not a
replacement for Meta's official connector and not a mechanism to evade platform safeguards.

1. **Playwright / Patchright** driver dependencies, selectable only by the operator. The driver visits **explicitly allowlisted test origins**; it does not implement login, account takeovers, CAPTCHA solving, social publishing or anti-detection workflows.
2. **Headful Chromium + Xvfb** in a separate non-root container, with per-account test profiles.
3. **Temporal** TypeScript workflows and activities, with a single concurrent browser inspection and no automatic retry. The optional Compose stack uses Temporal's *development* server; do not use it as production durable infrastructure.
4. **Per-account SOCKS5 or HTTP(S) proxies**, read from an operator-owned JSON file mounted read-only. Credentials are never accepted in workflow arguments, URLs or the account-facing API. Chromium does not support authenticated SOCKS5 with this driver; use HTTP(S) authentication instead.

## Safety and separation

Nothing in this folder is installed by the regular Social-Media pnpm workspace build or staging Compose. The separate Compose stack has the `experimental` profile and requires `EXPERIMENTAL_BROWSER_LAB_ENABLED=true` as well as an explicit `BROWSER_LAB_ALLOWED_ORIGINS` list. No origins are allowed by default. Social account passwords/cookies, CAPTCHA bypass and automatic social posting are not implemented. No public user APIs or routes have been added.

The default VPS with 4 GB RAM is too constrained for this lab to be run alongside the existing services without capacity and risk checks. Build and test it first on a **separate** development machine. The Dockerfile/Temporal CLI may consume significant RAM and disk. Browser profiles may contain sensitive data if an operator manually logs into test websites: use disposable test accounts, encrypt storage before any real account access, and destroy profiles after testing.

For local operator-only testing, from the repository root:

```bash
cd experimental/browser-lab
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
npm test
cd ../..
export EXPERIMENTAL_BROWSER_LAB_ENABLED=true
export BROWSER_LAB_ALLOWED_ORIGINS=https://example.org
export BROWSER_LAB_PROXY_MAP_PATH=$(pwd)/experimental/browser-lab/example.proxy-map.json
docker compose -f deploy/experimental/compose.yaml --profile experimental up --build
```

Use `docker compose -f deploy/experimental/compose.yaml --profile experimental down` to stop this stack. None of these instructions should be run on the production/staging VPS without separate approval.

To schedule a read-only test after the Temporal server is running, use `npm run submit -- account-test-001 https://example.org playwright` **inside** a trusted operator environment with `EXPERIMENTAL_BROWSER_LAB_ENABLED=true`, `BROWSER_LAB_ALLOWED_ORIGINS`, and `TEMPORAL_ADDRESS` configured. Never expose this command as an arbitrary user endpoint.

Example proxy mapping file (keep actual file outside Git, permission 0600):

```json
{
  "account-test-001": {"server":"http://proxy.internal:8080","username":"operator-managed-user","password":"REPLACE_WITH_SECRET"},
  "account-test-002": {"server":"socks5://proxy.internal:1080"}
}
```

The sample credentials above are **illustrative placeholders**, not functional secrets. Browser navigation blocks unapproved cross-origin requests and redirects. This is a controlled experiment, not a guarantee of account safety or compliance with social platform terms. The first-party Meta OAuth connector remains the supported live connection method.
