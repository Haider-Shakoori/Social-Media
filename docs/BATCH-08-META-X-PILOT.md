# Batch 8 — Meta + X official account connection pilot

## Scope
Only Facebook Pages, eligible Instagram professional accounts, and X (Twitter) are the pilot. The other seven platforms remain deferred: documented, not usable or activated.
Social-Media is a new, independent product; it does not share any other project's code, account sessions, database, service credentials or infrastructure.

## What is implemented
- Meta OAuth consent via Facebook Login with permission-scoped Page discovery and linked Instagram professional identities using Graph API v26.0. No Facebook personal-profile or arbitrary group posting.
- X OAuth 2.0 confidential-web-client code flow with PKCE S256, user identity lookup, and scopes tweet.read, tweet.write, users.read, offline.access. User never supplies a social password.
- Random one-time SHA-256-hashed OAuth state tied to the exact signed-in user, session, brand and network, expiring after ten minutes. Failed exchanges require a new attempt; callback redirects are to a fixed web origin.
- AES-256-GCM encryption of pending authorized-account details, X verifier, account access and refresh tokens, using a unique project-specific 32-byte base64 key. Access tokens are never sent back to UI.
- Brand managers can inspect provider readiness, select an approved returned account, link it while enforcing tenant connection quotas, inspect redacted account names/status, and clear locally stored tokens on disconnect.
- X OAuth disabled until app credentials, a separate operator/test flag, explicit X API spending consent, and an operator-only cost approval. No live paid calls in CI.
- Connector worker still refuses EVERY publishing job. No production posts, scheduling, media uploads, refresh jobs, API analytics or remote deletion/revocation are enabled.

## Configuring test access, after explicit authorization
1. Register dedicated Meta and X developer apps for THIS standalone SaaS. Verify current developer eligibility, Meta permissions/review, X pricing and user-consent scope restrictions.
2. Generate SOCIAL_TOKEN_ENCRYPTION_KEY as a unique 32-byte base64 secret. Back it up securely; losing it makes saved provider sessions unreadable. Never place it in client/Next.js public variables.
3. Set META_APP_ID, META_APP_SECRET, META_REDIRECT_URI to the exact whitelisted HTTPS API callback and META_CONNECT_ENABLED=true. Set Facebook/Instagram SocialProviderPolicy to TESTING with operatorEnabled=true through protected platform management.
4. For X, set X_CLIENT_ID, X_CLIENT_SECRET, exact HTTPS X_REDIRECT_URI and X_CONNECT_ENABLED=true, but ONLY after permission/cost review. X_API_BUDGET_APPROVED=true, a positive X_API_MAX_MONTHLY_USD_MINOR and trusted-operator database provision of the X policy costApproved=true are mandatory. No tenant user can self-approve.
5. Note: X_API_MAX_MONTHLY_USD_MINOR is an approval threshold **not an actual provider expense ledger**. Until hard API billing telemetry/rate-cost caps exist, keep X_CONNECT_ENABLED=false in production. Meta/X API calls may be metered under the provider agreement.
6. Configure web and API origin/cookie scopes, HTTPS, precise OAuth callback URLs and WEB_BASE_URL. Browser callback must receive the same authenticated cookie as the initiating session.
7. Test with app-authorized Facebook Pages, Instagram professional identities and permitted X developer test accounts; verify real scopes and errors before onboarding customers.

## Incomplete release gates
- Meta token exchange/discovery are coded but not tested against an approved real app; token expiry is approximate and individual Instagram/Page access requires live eligibility verification.
- X token refresh, forced token revocation and hard provider monetary metering are not yet implemented. Local disconnect clears credentials but may not revoke consent on Meta/X; user should also revoke in their platform account settings.
- Post editor, immutable approval/version binding, schedule, account policy checks, rate limits, idempotency, provider-side publish verification and analytics are later milestones.
- No production Ready state may be inferred solely from GitHub CI or a linked test account.

## Source references
- https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media_publish
- https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

No merge, production deployment or changes to unrelated systems are authorized.
