export const site = {
  productName: "Social-Media",
  description: "AI-assisted content planning, human approvals, and responsible social publishing for teams and agencies.",
  get url() { return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""); },
  get indexingEnabled() { return process.env.PUBLIC_INDEXING_ENABLED === "true"; },
};

export const primaryNavigation = [
  { label: "Features", href: "/features" },
  { label: "AI Studio", href: "/ai-content" },
  { label: "Scheduling", href: "/scheduling" },
  { label: "Approvals", href: "/approvals" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const footerGroups = [
  { title: "Product", links: [
    { label: "Features", href: "/features" }, { label: "AI Studio", href: "/ai-content" },
    { label: "Content Calendar", href: "/scheduling" }, { label: "Approvals", href: "/approvals" },
    { label: "Integrations", href: "/integrations" }, { label: "Pricing", href: "/pricing" },
  ] },
  { title: "Solutions", links: [
    { label: "For agencies", href: "/solutions/agencies" }, { label: "For small businesses", href: "/solutions/businesses" },
    { label: "Knowledge base", href: "/docs" }, { label: "Guides", href: "/blog" },
  ] },
  { title: "Company", links: [
    { label: "About", href: "/about" }, { label: "Contact", href: "/contact" }, { label: "FAQ", href: "/faq" },
    { label: "Service status", href: "/status" }, { label: "Changelog", href: "/changelog" },
  ] },
  { title: "Legal", links: [
    { label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" },
    { label: "Acceptable use", href: "/acceptable-use" }, { label: "Cookies", href: "/cookies" },
  ] },
] as const;

export const platformPlans = [
  { name: "Instagram", scope: "Eligible professional accounts", status: "Planned", detail: "Batch 8: official Meta publishing after app permissions and account eligibility are verified." },
  { name: "Facebook", scope: "Managed Pages", status: "Planned", detail: "Batch 8: Page publishing only with authorized app scopes and administrator permissions." },
  { name: "Threads", scope: "Authorized Threads accounts", status: "Planned", detail: "Batch 20: official Threads publishing after separate Meta Threads app authorization and eligibility checks." },
  { name: "Pinterest", scope: "Authorized boards and Pins", status: "Planned", detail: "Batch 21: Pinterest API v5 Pin publishing after board, media and developer access checks." },
  { name: "LinkedIn", scope: "Eligible members and company Pages", status: "Review required", detail: "Batch 22: supported LinkedIn Posts API publishing subject to member/organization permissions and Page roles." },
  { name: "TikTok", scope: "Authorized creators", status: "Review required", detail: "Batch 23: creator-approved video/photo publishing requires Content Posting API scopes and audit for public posts." },
  { name: "YouTube", scope: "Authorized video channels", status: "Review required", detail: "Batch 24: video uploads subject to Google OAuth, API quotas, and any public visibility audit." },
  { name: "Google Business Profile", scope: "Eligible business locations", status: "Review required", detail: "Batch 25: Local Posts only, after Google Business Profile project approval and eligible location access." },
  { name: "X (Twitter)", scope: "Authorized developer API accounts", status: "Manual fallback", detail: "Batch 26: paid or metered official API publishing only with explicit operator budget approval; manual by default." },
  { name: "Reddit", scope: "Approved commercial community use", status: "Manual fallback", detail: "Batch 27: commercial Reddit developer contract and subreddit rules required for API publishing; manual by default." },
] as const;

export const faqItems = [
  { q: "Does the platform publish without my approval?", a: "The planned default is no. Every AI-generated post requires approval of its exact content version before automatic publishing. Editing an approved post revokes its approval." },
  { q: "Can I use a personal Instagram account?", a: "The planned official Instagram publishing integration is limited to eligible professional accounts. Unsupported account types will be offered a manual publishing flow." },
  { q: "Will all ten planned platforms work at launch?", a: "No. Ten networks are planned across 27 batches, but automatic publishing will be enabled separately per eligible provider and app approval. Initial priority is authorized Instagram and Facebook Page publishing; unsupported networks retain manual export." },
  { q: "Does connecting accounts eliminate suspension risk?", a: "No. Authorization and cautious publishing can reduce avoidable problems, but social networks control enforcement, and there is no ban-proof method." },
  { q: "Is WhatsApp approval mandatory?", a: "No. In-app and email approvals are the default. The existing relayWA-style WhatsApp bridge may be offered as an optional experimental method with clear limitations." },
  { q: "Can our agency manage different client brands?", a: "Multi-brand workspaces, client-only approver roles and usage limits are in the product plan. These features are not yet available in the foundation preview." },
  { q: "Are AI images free without limits?", a: "No. The proposed launch uses available free inference allowances, metered by tenant. Once quotas run out, generation should stop or use a deterministic template fallback." },
  { q: "Can I pay for a subscription today?", a: "Not yet. Published plan descriptions are illustrative. Customer billing and public registration will open only after the service is ready and a supported payment arrangement is verified." },
] as const;

export const plans = [
  { name: "Starter", subtitle: "For a single growing brand", features: ["1 brand workspace", "Content calendar", "AI-assisted drafts with quotas", "In-app and email approvals", "Eligible social connectors"], featured: false },
  { name: "Growth", subtitle: "For teams planning ahead", features: ["More social channels", "Multi-user review workflow", "Recurring content rules", "Extra AI generation allowances", "Analytics as supported"], featured: true },
  { name: "Agency", subtitle: "For multi-brand operations", features: ["Multiple client brands", "Client approver roles", "Separate brand workflows", "Team permissions", "Consolidated reporting"], featured: false },
] as const;
