# Batch 4 — Workspace, Brand and Team Management

## Implemented
- Multi-brand profiles with optional industry, website, description, audience, tone, primary color, localized language array (en/fa-AF/ps/ar), and archive timestamps.
- Versioned Prisma migration applied and compared against schema in GitHub CI.
- Tenant owners/admins create/update/archive brands. Editors edit **only** assigned brands, while approver/viewer roles are read-only.
- Tenant owner/admin team invitation via SMTP: 72-hour opaque single-use link; token **hash** stored, never raw token; verified email must exactly match invitation; invite renewal revokes older link; admin invitations owner-only.
- Invitation list and cancellation; accepted member roles; owner-only tenant role reassignment and member removal (which also revokes brand grants).
- Agency-style organization with multiple workspaces/brands and explicit per-brand grants; tenant administrators have automatic organization-wide access.
- Tenant management UI: accessible forms for brand profile create/edit, archived brand action, team invitations, membership control, individual grant/revoke, and a signed-in invitation acceptance page.
- No production social connection or AI/publishing capability enabled.

## User workflows
Create an organization at /dashboard; create or select workspace; add brand; invite users by email. Invited users register with the same verified email, sign in, revisit invitation URL if necessary, and accept. Owner/admin grants each non-admin user brand-specific permissions. All reads and writes enforce tenant ownership in the API.

## Security and safety
- Cross-tenant access: 404 on unrelated tenant/workspace/brand IDs.
- Existing tenant editors have **no implicit brand access**.
- Owners cannot self-demote or remove themselves; non-owners cannot escalate role.
- Account restrictions and brand archival must block later publication attempts (future batch).
- Invite mail delivery requires SMTP configuration; no fake email transport.
- Do not deploy development Mailpit or expose DB/Redis ports.
- Before production: review transactional invitation race behavior, cross-browser cookies, SMTP delivery/spam, audit logs, appropriate logo/media upload handling, limits/quotas, and real Playwright UX checks.

## Validation
CI migrates PostgreSQL and checks drift, typechecks, runs unit tests and Next.js/NestJS builds, and executes real HTTP integration tests against PostgreSQL/Redis/Mailpit. Full regression tests cover invitation mismatch/replay/revocation, tenant ownership, cross-tenant modification, granted-only editor access, archival, role escalation and removal.

## GitHub flow
Batch 4 PR #4 targets Batch 3 PR #3 branch. All PRs remain unmerged until user review. No VPS deployment or unrelated-project changes.
