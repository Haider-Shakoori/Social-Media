# Email Approve / Reject for Social-Media Manager

## Implemented on this branch

The existing post-approval workflow requires an independent reviewer for a versioned draft. When `APPROVAL_EMAIL_NOTIFICATIONS_ENABLED=true`, the backend additionally sends an email to verified users with an existing OWNER, ADMIN or assigned brand APPROVER role, **only if** they enabled "Allow optional email copy" in the Notification Center. The draft requester is excluded. An in-app notification is still created even if email fails.

Each reviewer email includes two buttons as plain links:

- **Approve** — navigate to `/review?tenant=...&workspace=...&brand=...&request=...&decision=APPROVED`
- **Reject** — navigate to `/review?tenant=...&workspace=...&brand=...&request=...&decision=REJECTED`

**Email is NOT authentication and GET never changes anything.** A reviewer must log into the same SaaS and manually press the confirmation button. That button invokes the existing protected POST endpoint; it still verifies tenant/workspace/brand access, reviewer role, request expiration, matching immutable post version, one-time transition, and the four-eyes rule. An email link contains no login token, publishing token or other secret. Automatic email link scanners cannot approve a post, and forwarding an email does not give the recipient permissions.

Approval changes the post to APPROVED; it **does not publish**. Rejection sends it back to draft for revision. Publishing remains protected by independent feature gates.

## Still required before external email is usable

**Current Docker staging Compose forces SMTP_HOST=mailpit** and sends exclusively to an internal test inbox. External recipients will not receive messages. Configure deliverable SMTP from a dedicated domain with SPF, DKIM and DMARC before enabling the flag. If external mail is desired, update the Compose SMTP_HOST/SMTP_PORT override safely; do not alter RelayWA, FieldPulse or any unrelated service.

The initial email delivery implementation sends after committing the DB approval request and is best-effort. Add a durable outbox, retry tracking, webhook delivery receipts and branded templates before commercial SaaS launch.

## Publishing integration

Official Instagram image container creation, status polling and publishing helpers already exist under `apps/api/src/publishing/instagram-image-publisher.ts` on main. Its permission `instagram_business_content_publish` is requested by the OAuth `INSTAGRAM_SCOPES` variable only after Meta grants it and account owners reauthorize. An upload storage service is **not implemented**: Studio stores HTTPS media URL references. A public HTTPS media origin with tenant-controlled ownership, image validation, scanning and retention is needed before production image posting.

Publisher release flags remain disabled in staging, and email approval does not bypass any publication gate.
