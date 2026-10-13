# Batch 6 — Platform Super-Admin and Website CMS

## Implemented
- Database-backed operational overview (tenant, user, workspace, brand, connection, subscription/post counts).
- Protected, paginated registered-user and tenant registries, **read-only**; never return password hashes, email tokens, or session secrets.
- Platform administrator audit feed and safe settings editor restricted to allowed keys: cms_public_enabled, support_email, maintenance_notice.
- CMS supports localized ARTICLE, GUIDE and PAGE entries, slug, metadata, text-only section bodies, drafts, revision checks, explicit publish/unpublish, archive, publication dates, and operator identity.
- Every mutation produces a database PlatformAuditEvent in the same transaction.
- One-time explicit CMS publishing flag CMS_PUBLISHING_ENABLED; public article delivery separately requires API + Next CMS_PUBLIC_ENABLED=true and database cms_public_enabled=true.
- Public CMS endpoints cannot serve draft or archived entries. Editing a published entry retracts it until explicit re-publication.
- Next.js /blog, /docs, and /[slug] routes incorporate permitted published CMS entries, fall back to bundled documentation when CMS disabled or API unreachable, and render text via React escaping (no raw HTML).
- Platform UI at /platform with dashboard, CMS editor, organization registry, user roster, audit feed, and safe settings. Billing remains at /platform/billing.
- GitHub CI: real Postgres migration/drift checks, typecheck, builds and end-to-end negative/positive tests for admin permissions, content lifecycle and public fallback.

## Flags and deployment
All CMS features remain pre-launch. Published entries are **not** publicly visible by default:
1. CMS_PUBLISHING_ENABLED=true in API environment enables an administrator to publish a record.
2. CMS_PUBLIC_ENABLED=true in the API environment permits serving public records.
3. Platform database setting cms_public_enabled must be explicitly set true by authorized platform admin.
4. CMS_PUBLIC_ENABLED=true and CMS_API_BASE_URL=<trusted internal API /api/v1 root> in Next.js server environment permit rendering additional entries.
5. PUBLIC_INDEXING_ENABLED=false keeps the search crawler off until full launch review.

Do not expose Mailpit, Postgres, Redis or admin endpoints without an HTTPS reverse proxy, MFA/step-up authentication, transport security, operating monitoring and formal legal review. Platform admin assignment remains a trusted provisioning operation; no public elevation endpoint is implemented.

## Limitations
- Tenant/user registries are read-only; full support ticket operations and user identity export/deletion are later batches.
- CMS is currently structured text sections, not WYSIWYG/media attachments. Static built-in blog/docs/marketing/legal slugs take precedence and cannot be overwritten or unpublished through CMS. Reserved site route slugs are rejected for new CMS pages.
- CMS locale-aware content is persisted for en, fa-AF, ps and ar; public Next.js display currently reads English entries until multilingual routing/RTL in Batch 18.
- Custom website pages are now editable and included in the sitemap when published; bundled product feature layouts, navigation/global SEO configuration and the legal drafts remain source-controlled rather than fully editable through CMS.
- Aggregate subscription states are raw storage values, not recalculated expiry; inspect tenant billing for effective state.
- Actual production social publishing and third-party APIs are not active.
- React visual accessibility testing and multi-device browser QA are still required.

No merges to main, no VPS deployment, no relayWA changes.
