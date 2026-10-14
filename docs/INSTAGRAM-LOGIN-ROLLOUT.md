# Instagram Business Login — safe rollout

> This feature branch adds **Instagram Login**, distinct from the existing Facebook Login/Instagram Page integration.
> It has NOT been deployed. No public customer access or publishing is enabled by this change.

## Meta Developer dashboard URLs

In **Instagram API → API setup with Instagram login → Business login settings**, use these
only **after the corresponding service is deployed, routed over HTTPS and tested**:

- OAuth redirect URI: `https://socials.businessos.af/api/v1/social/oauth/instagram/callback`
- Deauthorize callback URL: `https://socials.businessos.af/api/v1/social/meta/deauthorize`
- Data deletion request URL: `https://socials.businessos.af/api/v1/social/meta/data-deletion`
- Deletion receipt/status is issued dynamically at `/api/v1/social/meta/data-deletion/status?code=...`.

The OAuth URI must be committed as a separate chip in Meta's input (press Enter), not merely
typed into the box. Remove the homepage redirect after the backend route is verified.

The URL in Meta MUST match `INSTAGRAM_REDIRECT_URI` byte-for-byte (scheme, hostname, path,
trailing slash). The reverse proxy must forward `/api/v1/social/*` to the NestJS API,
not the Next.js homepage.

## Secrets and rollout flags

Use **the Instagram app ID and Instagram app secret from Meta's Instagram API setup**
(server-side only). Do not confuse these with `META_APP_ID` and `META_APP_SECRET` used
for Facebook Login. Never put tokens/secrets in `NEXT_PUBLIC_*`, commits, tickets, or screenshots.

```ini
INSTAGRAM_CONNECT_ENABLED=false
INSTAGRAM_APP_ID=<Instagram API app ID>
INSTAGRAM_APP_SECRET=<server-only Instagram API app secret>
INSTAGRAM_REDIRECT_URI=https://socials.businessos.af/api/v1/social/oauth/instagram/callback
INSTAGRAM_SCOPES=instagram_business_basic
```

Ensure a unique valid `SOCIAL_TOKEN_ENCRYPTION_KEY` is provisioned in your secret manager.
Operator enablement additionally requires `social_provider_policies.instagram` to be
`TESTING` and operator-enabled, and the tenant must have an active subscription.
Use the Meta app's authorized Instagram tester account while still in development.
Do not enable for arbitrary customer accounts until Meta grants the applicable access.

Only request optional `instagram_business_*` permissions after the matching features
are implemented and approved. Default is **basic only**.

## Connection mechanics

- UI `Authorize Instagram` starts a short-lived, user/session/tenant/brand-bound state.
- User consents on `www.instagram.com/oauth/authorize`.
- Backend exchanges code on `api.instagram.com/oauth/access_token`, then extends on
  `graph.instagram.com/access_token` and checks `graph.instagram.com/me` identity.
- Only encrypted long-lived credentials and the Instagram account ID are persisted,
  bound to the selected brand.
- The API never returns raw tokens to browsers.
- Account health is intentionally **LIMITED** if actual Instagram permission grants cannot
  be verified; the Facebook `/me/permissions` API is not used for this flow.
- Instagram Login publishing is blocked explicitly in the existing
  Facebook Graph publisher to prevent sending Instagram Login tokens to the wrong host.
- Refresh uses `graph.instagram.com/refresh_access_token` for eligible long-lived tokens.

## Lifecycle privacy callbacks

The Meta deauthorization and deletion endpoints accept only an HMAC-SHA256 signed_request
verified against the Instagram app secret. Unlike first-party actions, they are
server-to-server callbacks that may lack Origin or JSON content type. Their CSRF
exception is limited to these two exact routes, and **signature validation is mandatory**.

A successful callback clears matching direct-Instagram token material, account
identifiers, and account names in our social-connection rows across brands. Data deletion
returns a signed, 30-day completion receipt after the database mutation finishes.

**Compliance limitation:** this only clears direct Instagram connection fields.
Before App Review, audit any retained content/media/messages/analytics, backups, logs
and downstream processors; implement appropriate purge/retention policies and a privacy
contact workflow. A callback alone is not proof of full regulatory compliance.

## Verification checklist

1. GitHub CI: Prisma checks, TypeScript typecheck, unit tests, build and existing e2e.
2. Confirm existing Facebook Page OAuth still functions with its separate Meta app settings.
3. Verify reverse-proxy routing to both callback paths on staging over TLS.
4. Set Instagram credentials securely; operator enables only controlled testing.
5. Sign in as a legitimate Instagram tester and connect a professional account.
6. Confirm **the exact expected IG account** appears in the matching brand; token stays encrypted.
7. Confirm wrong/expired state and wrong identities fail; HMAC tampering rejects.
8. Confirm deauthorization removes stored credentials; deletion returns and resolves receipt.
9. Complete Meta App Review and business verification before public customer access.
