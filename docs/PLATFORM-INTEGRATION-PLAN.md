# Official Social Platform Integration Plan
_Date reviewed: 2026-10-14. Technical plan, not proof of approved API credentials or production availability._

## What "included" means
All ten networks are first-class targets of the unified editor and integration status page. Inclusion in the roadmap is **not** an offer of authorized production automatic publishing. Only enable a live adapter after the developer app, provider terms, commercial permission, appropriate account access, exact OAuth scope, supported media formats, and API cost are actually verified. Where those gates fail, use an explicit copy/download/manual-publishing experience.

## Release status vocabulary
- `planned`: roadmap only; no live adapter.
- `manual_only`: user can export assets and instructions; no backend publish.
- `awaiting_approval`: API is technically possible but provider credential/review/cost consent is not complete.
- `testing`: authorized test integration, not available commercially.
- `production_ready`: permitted production test passed and account, format, scope, quota and commercial gates documented.
- `restricted`: token, account or policy restriction; suspend publishing and show recovery steps.
- `disabled`: operator/tenant kill switch.

The current repository is **pre-launch**. ALL production integrations must remain OFF, even when a network is listed on the public website.

## Provider-by-provider specification

### Instagram — Batch 08
- **Accounts:** eligible Instagram professional accounts (not arbitrary personal profiles), with required Meta permissions and any Facebook Page linkage dictated by the current API route.
- **Target features:** API-supported image/video/carousel formats; per-target validation and publishing result; analytics only if approved.
- **Gates:** Meta app review, token scopes, account/Page eligibility and actual test posting.
- **Fallback:** export the image/video and caption with manually executable steps.

### Facebook — Batch 08
- **Accounts:** Pages administered by authorized users, not automatic posting to arbitrary personal profiles or groups.
- **Target features:** text/image/video Page posts when supported, published object ID, scheduled worker integration and available page/post insights.
- **Gates:** Meta app review, Page roles, Page-scoped permissions and compliance.
- **Fallback:** Page-ready media and caption download.

### Threads — Batch 20
- **Accounts:** authorized Threads users through an appropriate Meta Threads app use case.
- **Target features:** text/image/video container and publish flow; carousel only if permission/formats are documented; statuses and available insights.
- **Gates:** Meta Threads consent and scopes; platform rate limits; review and approved commercial usage as applicable. Do not assume Instagram permissions grant Threads access.
- **Fallback:** text/media export with manual publication.
- **Official reference:** https://www.postman.com/meta/threads/collection/dht3nzz/threads-api

### Pinterest — Batch 21
- **Accounts:** eligible Pinterest user or business accounts and boards supported by authorized API access.
- **Target features:** choose board, compose image/video Pin if supported, destination URL/alt text, create Pin, reconcile returned Pin ID and available analytics.
- **Gates:** official v5 app approval and allowed use, content policies, supported media requirements, user-granted scopes/quotas.
- **Fallback:** image, title, description, destination URL, board selection package.
- **Official reference:** https://developers.pinterest.com/docs/api/v5/pins-create/

### LinkedIn — Batch 22
- **Accounts:** authenticated members and organizations only where scopes permit; organization publishing requires appropriate Page role.
- **Target features:** Posts API text, image, video, documents as permitted; assets workflow, remote ID and per-post status. No blanket promise of polls/carousels/comments.
- **Gates:** `w_member_social` for eligible member posting; `w_organization_social` and matching Page admin roles for organization posting; verify restricted API products/scopes before shipping.
- **Fallback:** LinkedIn-appropriate text/media export.
- **Official reference:** https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api

### TikTok — Batch 23
- **Accounts:** explicitly authorizing creator accounts supported by Content Posting API.
- **Target features:** query creator info immediately before compose, supported videos/photos, user-confirmed privacy settings and creator controls, asynchronous processing and publish status.
- **Gates:** approved Direct Post capability, `video.publish` authorization, configured domain/media URL rules and **TikTok audit for public visibility**. Unaudited posting is limited to private mode. No disguised workaround.
- **Fallback:** export validated video/photo and caption for manual posting.
- **Official reference:** https://developers.tiktok.com/docs/en/content-posting-api-get-started

### YouTube — Batch 24
- **Accounts:** authorized YouTube channels.
- **Target features:** video uploads using Data API `videos.insert`, resumable media, title/description/tags, thumbnails if permitted, privacy selection, delayed processing state.
- **Gates:** Google OAuth consent, API project quota and audits; unverified upload projects may have public video uploads restricted to private. Not a generic text/image post adapter.
- **Fallback:** publish-ready video files and metadata export.
- **Official reference:** https://developers.google.com/youtube/v3/docs/videos/

### Google Business Profile — Batch 25
- **Accounts:** business locations with authorized owner/manager access.
- **Target features:** supported Local Posts: updates, events, offers, CTA actions, eligible imagery; location selector and result status.
- **Gates:** Google Cloud **Business Profile API project approval**, correct OAuth scopes and nonzero quota, verified eligible location. API `localPosts` functionality does not equate to social feed posting; product posts cannot be created through this API.
- **Fallback:** location-specific posting content/asset pack.
- **Official references:** https://developers.google.com/my-business/content/basic-setup and https://developers.google.com/my-business/content/posts-data

### X (formerly Twitter) — Batch 26
- **Accounts:** OAuth-authorized X accounts with permitted developer access.
- **Target features:** text, supported image/video where authorized, post ID reconciliation, duplicate prevention and opt-in delivery budget.
- **Gates:** verify current official X API terms, credentials, post endpoints, quotas **and metered billing before ANY live call**. Configure spend cap, kill switch and explicit operator payment approval. Under the default VPS-only cost plan it stays manual-only.
- **Fallback:** 280-character-aware draft packaging with media; do not assume all account content options are supported.
- **Official developer reference:** https://docs.x.com/x-api

### Reddit — Batch 27
- **Accounts:** accounts authorized to post to permitted subreddits only.
- **Target features:** when contractually permitted, select subreddit, validate post flair/types, respect subreddit rules, report automoderation/moderation status, and support explicit approval and draft export.
- **Gates:** Reddit **commercial API permission and contractual agreement** for a monetized multi-tenant SaaS; moderation/community rules, rate limits and identity compliance. No API publish before written approval; no captcha or suspension bypass.
- **Fallback:** structured title/body/flair/media draft and manual user submission.
- **Official references:** https://support.reddithelp.com/hc/en-us/articles/14945211791892-Reddit-Developer-Interfaces and https://redditinc.com/policies/data-api-terms

## Shared security/quality acceptance criteria for each provider
1. Persist a **provider capability descriptor** keyed by account type, app mode, scope, post/media type, metric and date last verified.
2. Enforce user+tenant+brand ownership before connect/publish; OAuth state and PKCE where supported; encrypt tokens and include revocation/refresh flows.
3. Validate mime type, size, aspect ratio, alt text, duration, visibility, board/location/page/community selection **before** publishing.
4. Require the exact approved post version and active subscription/usage allowance; never silently change text, media, account or scheduled time.
5. Provider-specific queue policy, retry semantics, publish-result reconciliation and duplicate protections; no blanket fixed-ten-minute anti-ban trick.
6. Record remote object ID, sanitized provider error, retryable vs terminal failure, attempts, timestamp, manual intervention and per-target status.
7. Respect the platform's right to restrict accounts; immediate pause/kill-switch and no browser fingerprint/proxy rotation to evade policy.
8. Never infer analytics availability or label "published" without a definitive provider response (or documented reconciliation).
9. Mocked contract tests run without API keys; separate real account tests are opt-in and must be explicitly authorized.
10. Verify API costs, permitted commercial use and app approvals immediately before production enablement. If blocked, manual fallback remains visible.

## Implementation sequencing
- Batches 01–19 deliver the core editor, approvals, worker, quota guard and initial approved Meta adapter when credentials are available.
- Batches 20–27 add an independent, gated adapter per provider in the priority order listed. They can be developed as mocks without API credentials, but production activation never happens automatically when code merges.
- Platform super-admin (Batch 06) must configure access flags per provider + tenant, account type, scopes and quotas, cost gate and operator kill switch.
- Marketing copy should always distinguish **planned network coverage** from **enabled publishing**.

## Financial constraint
The VPS-only starting budget cannot cover arbitrary paid developer API calls. X may require metered charges, Reddit requires commercial permission/contract, and other providers can impose audits, review, quotas or eligibility restrictions. **Do not buy API access, enable card billing, or deploy anything as a byproduct of this roadmap update.**

## Source-check notes
The official provider references above were examined for this plan on October 14, 2026. Provider policies change: refresh them before implementing each batch. Do not treat these documents as granting the product any API permission.
