# Instagram: email review and official image publishing (staged, disabled by default)

## Reviewer approval by email

A draft creator requests approval in the Studio. The existing approval workflow records a pending immutable post version and notifies independent reviewers. When `APPROVAL_EMAIL_NOTIFICATIONS_ENABLED=true`, **verified** reviewers with `notificationEmailOptIn=true` also receive email containing **Approve** and **Reject** links.

Email links lead to `/review?tenant=...&workspace=...&brand=...&request=...&decision=...`. They do **not** authorize a reviewer or mutate state: the reviewer must sign in, view the draft and click **Confirm**. The existing authenticated POST approval endpoint enforces tenant, workspace, brand, reviewer role, expiry, version validity, one-decision-only and four-eyes policies. Rejecting returns the draft to DRAFT; approving grants scheduling readiness, **not publication**. Links contain no credentials or tokens. Email and link scanners cannot approve automatically.

**Staging SMTP is Mailpit** inside Docker: notification emails DO NOT reach outside inboxes. Before using real addresses, configure vetted external SMTP and verify sender-domain SPF/DKIM/DMARC. Do not expose the Mailpit interface publicly.

Users enable optional email notifications in the Social-Media notification inbox. Delivery is best effort after the database transaction commits; failed SMTP delivery never changes a review decision. A durable email outbox with retry/receipt tracking should be added before commercial launch.

## Instagram's required authorization

In the existing Meta Developer app, navigate to **Instagram → Permissions and features**. Request `instagram_business_content_publish` for Instagram Login, alongside `instagram_business_basic`. Meta controls whether your developer account can use development/standard access and whether review for external customer accounts is granted. A saved app access token does NOT grant these scopes.

Once Meta grants both, set `INSTAGRAM_SCOPES=instagram_business_basic,instagram_business_content_publish` in the private VPS environment, then restart only the API. **Existing connections need a fresh Instagram OAuth authorization** to obtain any newly granted scope. The backend must confirm the grants from the provider; merely requesting them or changing environment variables cannot prove approval.

The staging Compose **forces** `META_PUBLISHING_ENABLED=false`; the publisher profile also forces publishing off. Do not remove these controls before security, provider-permission, storage and end-to-end regression sign-off. Feature `INSTAGRAM_IMAGE_PUBLISHING_ENABLED` is independent and defaults to false.

## Image flow and missing upload storage

The Studio currently accepts public HTTPS media URLs and records media references; it **does not yet upload image bytes**. The image adapter `apps/api/src/publishing/instagram-image-publisher.ts` supports only one **publicly accessible JPEG image** at an operator-allowlisted host, defined by `INSTAGRAM_MEDIA_ALLOWED_HOSTS`. Instagram's servers must be able to fetch the image unauthenticated for the full container lifecycle; do not use private, local, signed-expiring, or intranet URLs.

**Required before commercial activation:** Create a dedicated `apps/api/src/media/` storage/upload module backed by private object storage (e.g. R2 or S3) with tenant-keyed object paths, authenticated presigned upload requests, server-side MIME and file-content verification, malware scanning, retention/deletion, public read-only distribution URL for approved assets, bucket CORS, file-size and resolution limits, and verified tenant ownership in immutable post versions. No object storage credentials or buckets are configured now.

Only after an independent post approval and all publish gates pass:
1. Create a media container via POST `https://graph.instagram.com/v26.0/{accountId}/media`, with an operator-allowlisted public HTTPS JPEG URL and caption.
2. Poll GET `https://graph.instagram.com/v26.0/{containerId}?fields=status_code` until `FINISHED`. Reject `ERROR`, `EXPIRED`, unexpected status and timeouts.
3. Send exactly one POST `.../{accountId}/media_publish` with `creation_id`. Store the provider media ID.
4. For a known remote media ID, use read-only GET `.../{mediaId}?fields=id,permalink` to reconcile. If the result of a write is uncertain, **never automatically resend**; retain the target as UNCERTAIN.

The adapter rejects requests unless `INSTAGRAM_IMAGE_PUBLISHING_ENABLED=true`, the token is an official Instagram Login token, both *verified* business scopes are present, and the JPEG URL is HTTPS under the media host allowlist. The platform publishing queue also requires approved content, a separate reviewer, active subscriptions, operator authorization, confirmed provider review, and global unpaused status. The worker is intentionally disabled in staging.

These code paths are tested with mock Meta responses; there is **no live Instagram image publication** yet.

## Operational rollout sequence

1. Finish validating the user's Instagram login and actual scoped authorization.
2. Obtain Meta development/advanced publishing access, as appropriate.
3. Implement, integrate and validate actual media upload/storage ownership.
4. Configure deliverable SMTP for email-review notifications; test approval/rejection with a separate real reviewer.
5. End-to-end test container create, status checks, single publish, report verification, and UNCERTAIN reconciliation with a permitted Instagram tester.
6. Separately authorize and enable production publishing flags only after sign-off.
