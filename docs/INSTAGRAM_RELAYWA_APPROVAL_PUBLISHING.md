# Instagram publishing + RelayWA approvals: staged integration

**Status: foundation only; no live publishing or WhatsApp approvals enabled.**
Instagram App API, RelayWA and media hosting are three separate systems. The Instagram token must **never** be sent to RelayWA. RelayWA's linked-device transport is unofficial WhatsApp Web; WhatsApp account restrictions or message loss are possible.

## Component ownership and exact code locations

| Component | Module / endpoint | Current status |
|---|---|---|
| Official Instagram Login and scopes | `apps/api/src/social-oauth/provider-transport.ts` and Meta App > Instagram > Permissions | Basic tested; content_publish must be granted |
| Image upload management | `apps/api/src/studio/*`, `MediaAsset`, new object-storage uploader | Currently only HTTPS URL references; **binary upload and malware scanning not implemented** |
| Instagram image publishing adapter | `apps/api/src/publishing/instagram-image-publisher.ts` | Built; unit-test only |
| Instagram container readiness | `instagramImageContainerStatus()` | FINISHED / IN_PROGRESS / ERROR / EXPIRED; no publish unless FINISHED |
| Publishing result verification | `verifyInstagramPublishedImage()` | Read-only; do not republish unknown outcomes |
| Queue / tenant and release gates | `apps/api/src/publishing/{publishing.service.ts,guard.ts,worker.ts}` | Gate integrated; disabled by default |
| Existing four-eyes approval | `apps/api/src/approvals/{approval.service.ts,approval.controller.ts}` | Enforces reviewer distinct from requester, version freshness, expiry |
| RelayWA signed webhook and send transport | `apps/api/src/approvals/relaywa-approval.ts` | Foundation only; no live trigger/receiver |
| RelayWA outbound endpoint | `POST /api/v1/sessions/:sessionId/messages/text` | In RelayWA repo `Haider-Shakoori/wa`; needs `messages.send` scoped API key |
| RelayWA inbound event | `message.received` signed webhook | Payload gives **messageId**, not text. Resolve with `messages.read` credential |
| RelayWA status/metadata | RelayWA dashboard and webhook-delivery logs | Independent provider and session |

## Official Instagram API sequence

1. OAuth requests `instagram_business_basic,instagram_business_content_publish` **only after** the Meta Developer app actually grants publishing access. Initial test credentials have only basic scope. After adding the scope to Meta and VPS, the account owner must **reauthorize**: old tokens do not gain new permissions automatically.
2. Upload a validated JPEG to isolated object storage under a tenant/brand key; run file-type, size and safety checks. Serve a time-limited but publicly fetchable HTTPS image URL to Meta. Meta servers must be able to GET the image without cookies or authorization headers. Never use private VPS files or an insecure local path.
3. With a direct Instagram token, `POST https://graph.instagram.com/v26.0/{ig-professional-id}/media` with `image_url` and `caption`; obtain container ID.
4. `GET https://graph.instagram.com/v26.0/{container-id}?fields=id,status_code`; wait for `FINISHED` or stop on `ERROR`/`EXPIRED`. Keep a durable container ID when implementing background publishing so a process crash cannot cause duplicate creation.
5. `POST https://graph.instagram.com/v26.0/{ig-professional-id}/media_publish` with `creation_id`. This **creates a public Instagram post**; never run it from test buttons without explicit permission and approval.
6. Store remote media ID, verify via read-only `GET /{media-id}?fields=id,media_type,permalink`; reconcile `UNCERTAIN` without blindly retrying provider POSTs.

## Approval flow: WhatsApp delivered through RelayWA

1. A post is saved as a versioned draft, then a separate reviewer is requested under `ApprovalRequest`; the creator **cannot approve their own post**.
2. RelayWA can send a WhatsApp review message showing the exact version, expiry and a link to `https://socials.businessos.af/dashboard?approvalRequest={uuid}`.
3. The reviewer **must authenticate to Social-Media Manager**, then choose Approve or Reject using the existing protected approval endpoint. This first phase permits review notifications without treating possession of a forwarded WhatsApp message as authorization.
4. Future **in-chat reply** support: RelayWA must sign `message.received` using HMAC SHA-256 of `{timestamp}.{rawBody}`, `x-relaywa-timestamp` and `x-relaywa-signature`. Verify within 300 seconds; resolve `data.messageId` via authenticated `GET /api/v1/sessions/:sessionId/messages/:messageId`; verify message direction=inbound, sender phone, private chat, exact session and expected tenant, then map to a **previously verified** reviewer phone and user account. Only then call `ApprovalService.review()` as that reviewer. Store webhook event/message IDs durably to reject replays, and retain the four-eyes + latest-version + expiry checks. Support `APPROVE {requestUuid}`, `ACCEPT {requestUuid}`, `REJECT {requestUuid}` **only after the complete verifier exists**. The parser itself never changes approval state.
5. No automatic publish on WhatsApp reply alone. Publishing is a separate post-approval queue action, with independent global, brand, tenant, provider, permission, token, subscription and approved-version gates.
6. If WhatsApp delivery fails or RelayWA is disconnected, do not bypass approval. Keep in-app approval and audit trail available.

## Configuration (secrets on VPS only; NEVER in GitHub or ChatGPT)

```dotenv
INSTAGRAM_CONNECT_ENABLED=true
INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_content_publish
INSTAGRAM_IMAGE_PUBLISHING_ENABLED=false
META_PUBLISHING_ENABLED=false
RELAYWA_APPROVALS_ENABLED=false
# RELAYWA_API_ORIGIN=https://<your-authorized-relaywa-api-host>
# RELAYWA_SESSION_ID=<uuid-of-connected-approved-sending-session>
# RELAYWA_API_KEY=<scoped-key-created-in-relaywa>
# RELAYWA_WEBHOOK_SECRET=<created-when-registering-the-relaywa-webhook>
```

Do not toggle publish flags until App Review/access, signed webhook + verified-phone mapping, image storage, publishing-status persistence, least-privilege secrets, tenant isolation, provider rate limits, separate approver, and staging end-to-end tests all pass. Creating an Instagram tester token does not grant publishing permission to all customers.

## Required remaining implementation before production

- Build direct binary-upload service using S3-compatible object storage with tenant isolation, authenticated presigned uploads, magic-byte and size checks, optional virus scanning, lifecycle deletion and short-lived public media access.
- Add verified WhatsApp phone ownership to each reviewer, tenant-local RelayWA sender session mappings, signed inbound webhook/controller, idempotent inbox receipt table, transactional approved-version decision and audit.
- Add durable Instagram media-container table/status transitions and safe resume/reconcile flow to handle worker crashes without accidentally reposting.
- Request Meta App Review for `instagram_business_content_publish` for customer accounts and reauthorize them. A Meta-approved professional account, granted scope, and successfully connected account are all required.
- Pilot with a separate reviewer and a disposable business test post only after final explicit owner authorization.

## Operational safety

The old Facebook Login publisher remains on `graph.facebook.com`; direct Instagram Login tokens route **only** to `graph.instagram.com` if all independent switches and provider gates permit. This code does not migrate apps to Cloudflare, change RelayWA configuration, or activate Instagram publishing.
