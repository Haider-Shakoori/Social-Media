# OPTION B — SELF-HOSTED SESSION CONNECTORS
**Standalone implementation prompt — controlled research, not production ban-proof automation**

This prompt intentionally includes the entire product specification. Use it as independent instructions to a coding agent.

## Connection strategy — mandatory

The customer wants to investigate relayWA-style connector modules that can maintain customer-authorized login sessions without buying an intermediary social API subscription. A Baileys-equivalent protocol does NOT exist for every social network, and a working open-source project does not imply commercial permission. Build adapters and an explicit technical/policy feasibility matrix first. Restrict self-hosted unofficial sessions to owned test accounts and controlled experiments unless the platform permits that specific automated use.

Research Instagram, Facebook, LinkedIn, TikTok, X and Reddit separately. For each, document current open-source library maturity, protocol/browser dependence, authenticated session handling, media capabilities, authorization mechanism, ToS restrictions, commercial eligibility, rate limits, expected resource consumption, challenge/recovery behavior, operational breakage and whether it may be activated. Status enum: permitted-and-verified, experimental-with-consent, manual-only, disabled-policy, unsupported.

No bypassing CAPTCHA/MFA, reverse-engineering authentication to defeat protections, evasion of rate limits, proxy rotation, browser fingerprint camouflage, mass account creation, stealth techniques or efforts to defeat platform bans. Manual export/publish fallback must be first class. If policy prohibits automation, do not silently activate a private endpoint. No customer should unknowingly be exposed to test-mode ban risk.

Architecture: NestJS owns tenant CRUD/authorization and a unified social connector contract. A separate Node.js connector worker runs bounded, resource-limited adapters with per-tenant encrypted session materials, explicit user-controlled authentication, connection expiry, bounded concurrency and safe cleanup of browser processes. Use Python service only if a particular integration genuinely demands it, and keep it isolated. No third-party passwords should be persisted in plaintext. Session sharing across tenants is forbidden. Stop on challenges and restrictions; notify and require user intervention. Do not promise ban immunity.

Financially, software licensing may be $0 while total costs include VPS CPU/RAM, engineering maintenance, broken-session support and account loss. Never mark an unofficial adapter production-safe without an actual authorized test, policy review and explicit platform-owner approval. Public marketing must disclose which providers are experimental or manual-only.


## Role and end goal

Act as principal software architect, senior full-stack TypeScript developer, UI/UX lead, DevOps engineer, AI integration engineer, security reviewer and QA lead. Build a genuine, independently deployable, globally oriented, multi-tenant AI Social Media Management SaaS. It is not a UI prototype. All shipped pages must have valid authorization, persistence, error handling and tests.

The application has three complete surfaces: (1) public marketing website and help center; (2) tenant/customer application for brands and agencies; (3) a separate platform super-admin. The user intends to pay only for an existing VPS initially. No surprise paid API or software usage.

### Confirmed relayWA-equivalent stack

- Node.js 22+, TypeScript, NestJS 12 for API, Next.js 16 with React 19 for web.
- PostgreSQL 17, Redis 8, reliable persistent job queues using BullMQ or an equivalent Redis-backed integration.
- pnpm monorepo, modular monolith with isolated workers rather than prematurely distributed microservices.
- Docker Compose, Nginx, health checks and GitHub Actions.
- Cloudflare Workers AI within its actual free quota, optional deterministic SVG/Sharp image templates, SMTP or provider free-tier transactional email, optional internal relayWA approval messaging adapter.
- Match relayWA's architecture and development conventions while keeping a completely separate repository, database, service credentials, containers, volumes and tenant data.
- Use feature flags and provider adapters. Support configurable model and provider selection. Do not assume a free tier is unlimited.
- No Laravel or PHP. No dependency on paid SaaS integrations for the initial controlled beta.

### 1. Multi-tenancy, access control and identity

Support: registered users, tenants, workspaces, brands, connected social accounts, campaigns, drafts, content calendars, social publishing targets, approvers, subscription plans, quotas, invitations, team memberships and support requests. Roles: platform owner, platform admin, support, tenant owner, tenant admin, content creator, editor, approver and viewer. Enforce tenant ownership on all database access, jobs, media, callback state, notifications, logs, API keys and realtime subscriptions. Allow agency accounts to manage multiple independently permissioned client brands.

Build email/password login, email verification, forgot/reset password, optional OAuth sign-in after configured, strong session handling, MFA when available, revoke sessions, audit trails, user deletion/export and role-specific onboarding. Use password hashing, least privilege and production-safe secrets. Onboarding: create workspace, add brand style profile, choose an eligible social connector, set publishing rules, choose approval recipients, preview and activate.

### 2. Full public website

Implement Home, Features, AI Content Generator, Image Studio, Scheduling, Approval Workflows, Safety & Security, Platforms and Integrations, Agencies, Small Businesses, Pricing, FAQ, About, Contact, Blog, Documentation/API Docs, Status, Changelog, Login, Register, Password Reset, Privacy, Terms and Acceptable Use.

Homepage: striking visual identity; hero with truthful product claims and CTA; product screenshots/interactive demo; how it works; sample AI calendar; multi-channel post preview; email/WhatsApp approval explanation; agency collaboration; reliability and security; supported-provider capability table; plan comparison; FAQ; final CTA. Do not invent reviews, customer counts or working networks. Fully responsive mobile/tablet/desktop; accessible controls, keyboard navigation, loading and failure states, professional light/dark themes, fluid but restrained motion. Build shared reusable UI components.

Implement global SEO: metadata, canonical URLs, Open Graph, X cards where permitted, XML sitemap, robots.txt, structured data, crawlable public content, meaningful documentation, consent-aware analytics, blog CMS, localized titles, proper language alternates. Support English, Dari, Pashto and Arabic; correct RTL navigation/forms, locale-aware formatting and timezone display. Marketing CMS editable by super-admin. Brand/product name remains configurable until chosen.

### 3. Tenant dashboard: real workflows

Navigation and functional modules:
- Overview: upcoming posts, approval backlog, social account health, published/failed counts, content usage, alerts.
- Workspaces / Brands: logos, colors, industries, audiences, tone, preferred languages, topics, banned phrases, approved media, timezone, company details.
- Social Accounts: connect, disconnect, scopes/permissions or session state, supported actions, last result, authorization status, explicit manual-only state.
- AI Studio: brand-grounded text prompts, variations, editing, hashtags, calls-to-action, rewriting, translation, image generation, captions, prompt history and cost/credits.
- Media Library / Templates: uploads, metadata, alt text, licenses, crops/ratios, deterministic text-heavy visuals, Arabic/Dari/Pashto typography.
- Content Library / Editor: immutable versions, previews per network, duplicate, bulk editing, campaign references.
- Calendar: month/week/day/list, filters, timezone display, drag/reschedule, recurrence, cancellation, conflict detection.
- Automation Rules: natural-language brief parsed into validated structured cadence, e.g. three weekly Instagram posts and Friday 10:00 Jumaa Mubarak graphic, always confirmed by customer.
- Approvals: review, approve, reject, revisions, comments, approver assignments, expiry and immutable version binding.
- Publishing: queues, scheduled, in-flight, confirmed, failed, timed out, rate-limited, manual fallback and detailed history.
- Analytics: only actually retrievable platform metrics with sourced timestamps; dashboards, comparisons, downloadable reports and evidence-based suggestions.
- Agencies/Teams: invite, share brand access, client-only approval views, permission sets.
- Plan / Usage: trial, entitlements, consumption and renewal.
- Protection Center: per-account pause, auth alerts, publishing errors, limits, audit trails and policy status.
- Notifications, support tickets, settings, account export/deletion, public API/webhook access where enabled.
No decorative fake buttons. Paginate large data, use search/filters and sensible empty/error states.

### 4. AI engine and content workflow

Cloudflare Workers AI is the initial configurable provider; do not lock to a particular model or assume specific currently listed models without validation. Count generation attempts and quotas per tenant. Block requests when free inference allowance or tenant credits are exhausted. Log provider failures and retry only safe operations. Use deterministic branded templates for text over imagery, because image models often produce inaccurate Arabic/Dari/Pashto lettering. Prevent misleading product imagery and require human review for sensitive religious, health, legal or financial claims.

Store drafts, exact image assets, captions, hashtags, generated variants, prompts/settings as appropriate with retention rules; support safe revision/approval. Content states: draft, generating, generated, review requested, approval pending, revision requested, approved, scheduled, publishing, published, uncertain, failed, manual action required, cancelled. Editing an approved post revokes approval. Never create a live publication from a mere preview.

### 5. Scheduling, approval and publication reliability

Parse natural language into explicit recurrence: brand, target destinations, day/time, IANA timezone, frequency, start/end, approval lead time, image requirement and format. Validate and ask for confirmation. Store instants in UTC and preserve timezone, handle DST and missed deadlines. Approval-before-deadline rule: approval authorizes the exact content; publish at scheduled time, not when approval arrives unless explicitly specified. Late approvals must follow an agreed reschedule policy.

Approval channels: tenant dashboard (always), email through existing SMTP or available free provider, optional relayWA adapter for WhatsApp notifications and reply webhook. relayWA is an unofficial Baileys-based WhatsApp service: isolate it as experimental and never treat delivery as guaranteed, never share customer sessions, and fall back to email/dashboard. WhatsApp replies must include unique request ID (e.g. AGREE 1042) or interactive controls that uniquely map to requests. Validate recipient/sender, signatures, nonce/idempotency, expiry, tenant, version and destination. Do not accept ambiguous replies, replayed events or approval from unauthorized users. Signed email approval links need expiry and protections against forwards/interceptors. Keep immutable approval audit history.

Persistent queues: per-provider/account caps, safe backoff, dead-letter queue, distributed leases, restart recovery and publishing state reconciliation. Timeouts after an external network accepted content are ambiguous: never blindly retry and duplicate publication. Associate attempt ID, content version, destination account, response, remote ID, policy and trace. Pause when disconnected, permission expired, restricted, or rate-limited. Keep queue and dashboard functional independently of connector crashes.

### 6. Subscription engine, manual billing and budget enforcement

Implement free trial, manually enabled paid plans, monthly/yearly entitlement records, renewal/grace/suspension, brand/account/seat/post/image quotas, usage ledgers, manual invoices and payments, discounts, platform-managed plan overrides and optional future payment-provider adapter. Do not hardwire Stripe because operator eligibility and settlement must be verified first. No payment processor is required to run the development beta. Enforce all entitlements server-side.

Control free-tier budgets globally and per tenant; show consumption and halt when exhausted. No automated activation of any paid AI API, social provider, proxy, sending service or analytics API. VPS is sole planned recurring bill; account for resource ceilings and backup capacity.

### 7. Platform super-admin: comprehensive, separate permissions

Build protected modules:
- Operations dashboard (tenants, MRR bookkeeping not fabricated payments, conversion, active trials, connected accounts, post outcomes, queue latency, failed jobs, AI consumption).
- Tenant registry: accounts/workspaces/brands, status, entitlements, usage, support, suspend/reactivate, deletion/export with audit.
- Users and access: role administration, failed logins, security events, session revocation.
- Plans and manual billing: trials, prices, entitlements, renewals, receipts, discounts, subscriptions.
- Provider registry: feature toggle, capability matrix, review/eligibility status, scopes, webhook health, incident status, connector stop switch.
- AI providers: model selection, credentials stored securely, budgets, free allowances, failures and quotas.
- WhatsApp/email: relayWA internal adapter configuration, SMTP, templates, delivery logs and fallback.
- Queue/worker observability: in-flight, pending, failed, dead-letter, memory/concurrency, retries and per-account halt.
- Account protection: aggregated restriction signals and emergency disable by tenant, provider or entire platform.
- Website CMS: home sections, marketing navigation, FAQ, blog, pricing content, legal pages, SEO and translations.
- Support: tickets, status notices, audit-only support views, user notices and announcements.
- Global settings: domains, branding, language, timezone, registration, security, logging, backups, maintenance.
Restrict sensitive credential viewing and require audit for all privileged actions.

### 8. Domain model and migrations

Design relational schemas with foreign keys, tenant keys, indexes and unique constraints for users, identities/sessions, tenants, workspaces, memberships, invitations, brands, brand_assets, social_providers, social_connections, provider_permissions, connector_capabilities, connector_events, content_plans, automation_rules, campaigns, posts, post_versions, post_targets, media_assets, ai_generations, ai_usage, approval_requests, approval_events, notification_deliveries, publishing_schedules, publishing_attempts, remote_publications, analytics_snapshots, plans, plan_features, subscriptions, usage_ledgers, invoices, manual_payments, api_keys, webhook_deliveries, audit_logs, security_events, support_tickets, feature_flags and settings. Use migrations, transactional updates, soft deletion only where appropriate, retention TTLs and encrypted credential fields.

### 9. Security, privacy and account safety

Security baselines: OWASP principles, password hashing, HTTP-only secure cookies where used, strong CORS/CSRF policy, anti-bruteforce throttling, input sanitation/validation, abuse limits, session revocation, MFA options, TLS, upload scanning/type restrictions, media authorization, token envelope encryption and key rotation design, webhook signing and dedupe, audit trail, secret redaction, backup encryption and tested restoration. Provide opt-in/consent, privacy notice, retention/deletion/export and DPA-ready technical controls. Avoid storing customers' social passwords. Protect other tenants even from compromised worker messages.

Account safety: only act with customer authorization, review content, detect duplicates, honor actual provider rate limits, halt after meaningful restriction/error, allow emergency pause and notify the user. Conservative caps are internal defaults and not a promise of safety. No ban-evasion fingerprint spoofing, CAPTCHA bypass, residential IP cycling or bypassing access controls. Do not promise zero bans or a numeric ban-risk score inferred from hidden platform systems.

### 10. Infrastructure, monitoring, testing and delivery

Separate application from relayWA in containers, networks, secrets, data and operational lifecycle. Docker Compose for local and VPS; API/worker/web, PostgreSQL, Redis, object/media storage folder; reverse proxy; health/readiness; log rotation, resource limits, deployment rollback, backups. Use GitHub CI for install, lint, typecheck, tests, builds, security checks, migration validation and container config. Do not deploy or change the VPS without explicit authorization; Desktop Commander only for deployment/push/pull when needed.

Testing: unit, schema, API, multi-tenant IDOR/RBAC, auth, connection capabilities, mocked provider contracts, approval-to-version binding, webhook replay/forgery, scheduled timezones/DST, expired trial limits, AI budget, queue retries, crash/restart recovery, ambiguous remote results/duplicate prevention, end-to-end Playwright workflows, accessibility/responsive checks, basic load tests and backup/restore. External integrations stay clearly unverified until actually tested with authorized access.

Documentation: architecture decision records, threat model, provider permission matrix, data model, API/OpenAPI, public/tenant/admin user guides, operator runbook, security/privacy checklist, recovery guide, cost and platform-eligibility constraints.

### 11. Batch execution contract

Work in small, reviewable GitHub branches and PRs with tests:
1. Repository and architecture foundations
2. Public website and design system
3. Multi-tenancy, identity and permissions
4. Workspaces, brands, team onboarding
5. Plans, trial and quotas
6. Platform super-admin foundation
7. Shared social connector contracts and capability registry
8. First approved connector / experimental evaluation according to the selected mode
9. AI text/image engine with cost caps
10. Content editor, media library and brand templates
11. Recurrence parser, calendars, scheduling
12. Email/in-app approvals and revision workflow
13. Optional relayWA WhatsApp approval adapter
14. Reliable publication orchestration and deduplication
15. Account Protection Center
16. Analytics and recommendations
17. Agency/client advanced workflows
18. Multilingual CMS/SEO and accessibility
19. Security, load, integration verification, release readiness

For every batch: implement actual code and migrations, expose API and UI only when functional, tests, typecheck and build, document risks/unavailable dependencies, include screenshots when practical, record changed files, report exact CI status and create a PR. Never claim tests passed unless they ran. Do not modify relayWA; do not deploy without explicit approval.


## Experimental-mode release gates

- MVP may ship the public website, brand management, AI, email approvals, calendar and manual publishing with *zero live unofficial connectors*.
- Run capability research on operator-controlled accounts, record evidence and breakage observations.
- Only enable permitted, proven features. If commercial access is not permitted, do not operate the adapter for tenants.
- Place all experimental connectors behind per-tenant consent and platform super-admin kill switches, with safe defaults OFF.
- Do not connect or import live relayWA customers' sessions or share tokens across applications.
- The product must continue to work if every unofficial connector is disabled.

Start with architecture docs, connector risk matrix, baseline monorepo and first batch on a feature branch; open a PR, and do not merge or deploy without approval.
