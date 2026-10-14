# Meta connector and gated publisher operations

This project has two different execution paths:

1. **Official account linking and health:** Meta OAuth, actual permission-grant capture, Page/Instagram ID binding, encrypted credentials, user-initiated token rotation and read-only account-health checks.
2. **Approval-bound publisher:** A durable PostgreSQL PostTarget queue. Sending is available in code for Facebook Page **text** posts and Instagram **single-image** posts only. All other media formats, X, and deferred providers are ineligible.

## Non-negotiable release gates

The default staging deployment has `META_CONNECT_ENABLED=false`, `META_HEALTH_MONITOR_ENABLED=false`, `META_PUBLISHING_ENABLED=false` and the publisher service excluded behind an inactive Docker Compose profile. No outbound publishing can occur on staging. Do **not** enable the publisher merely because the code or buttons exist.

Before attempting live Meta account linking, a platform operator must separately configure a reviewed Meta Developer App (`META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI=https://socials.businessos.af/api/v1/social/oauth/meta/callback`), 32-byte base64 `SOCIAL_TOKEN_ENCRYPTION_KEY`, valid app scopes, appropriate app users/roles and verified API eligibility. Only then deliberately enable `META_CONNECT_ENABLED` and the provider's `TESTING` policy. X remains disabled/manual-only and requires independent cost approval.

Before attempting any live publishing, require **all** of the following, in addition to reviewed credentials: explicit and separate operator approval for `META_PUBLISHING_ENABLED=true`, the dedicated publisher worker profile, a `PRODUCTION_READY` provider policy with `operatorEnabled`, `apiApproved`, and `productionVerified`, `global_social_pause=false`, an unpaused active brand, an active client subscription, a connected official account with unexpired token and actual required scopes, and approval by another person of the exact latest content version. No current staging workflow marks the provider production-ready.

Queue API:
- `POST /api/v1/tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/publishing/targets` with `postId`, `connectionId` and optional ISO UTC `scheduledAt`
- `GET .../publishing/targets` for statuses
- `POST .../publishing/targets/:targetId/reconcile` for an authorized owner to verify an uncertain Facebook post **only when a known remote ID exists**. No automatic retry.
- Operator-disabled staging queue responds 503 and does not create rows.

## Delivery semantics

Workers claim each target with a single conditional update. They recheck all safety gates and cannot enqueue X. A timed-out or failed provider write is recorded as `UNCERTAIN`; it is **never** blindly resent. A stale `PUBLISHING` state becomes `UNCERTAIN` rather than automatically retried. For unknown remote IDs, manual provider-side investigation is required. For known Facebook Page post IDs, read-only reconciliation checks the remote post and its Page identity. Instagram's multi-call image container/publish flow cannot guarantee an idempotent outcome after a dropped response; never auto-retry.

Credential access tokens and refreshable Meta user tokens are stored encrypted using AES-256-GCM and are never included in API/worker responses or logs. Health monitoring is **opt-in**, bounded per sweep, six-hour cadence, and only uses official read-only Graph requests. Refresh is user-initiated, validates original social identity, and is not an unapproved background publishing action.

Limitations before production: app review and actual live account authorization, media upload/virus scanning/ownership controls, real Meta publisher integration tests, larger-scale dispatch coordination, duplicate-provider-write reconciliation where the remote ID was lost, and provider-specific rate limiting and observability. Do not claim any production throughput or real-world post success from CI mocks.
