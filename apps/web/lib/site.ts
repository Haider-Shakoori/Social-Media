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

// Pilot-only website catalog. The broader network roadmap remains in internal docs and code.
export const platformPlans = [
  { name: "Facebook Pages", scope: "Managed Pages", status: "Pilot · disabled", detail: "Meta OAuth is implemented for approved test apps, but account linking stays off until dedicated credentials and authorization are supplied. Automatic publishing is disabled." },
  { name: "Instagram", scope: "Eligible professional accounts", status: "Pilot · disabled", detail: "Eligible Instagram professional accounts are part of the Meta testing pilot. Connection requires approved developer permissions; posting stays manual." },
  { name: "X (Twitter)", scope: "Official developer API accounts", status: "Manual fallback", detail: "Manual export is available. Live X OAuth/API access and paid calls remain disabled until explicit spending approval and hard budget controls." },
] as const;

export const faqItems = [
  { q: "Does the platform publish without my approval?", a: "The planned default is no. Every AI-generated post requires approval of its exact content version before automatic publishing. Editing an approved post revokes its approval." },
  { q: "Can I use a personal Instagram account?", a: "The planned official Instagram publishing integration is limited to eligible professional accounts. Unsupported account types will be offered a manual publishing flow." },
  { q: "Which social networks are available in the pilot?", a: "The pilot covers Facebook Pages, eligible Instagram professional accounts and X. Live provider connections and automated posting are currently disabled. Other networks remain deferred and are not offered in this staging release." },
  { q: "Does connecting accounts eliminate suspension risk?", a: "No. Authorization and cautious publishing can reduce avoidable problems, but social networks control enforcement, and there is no ban-proof method." },
  { q: "Is WhatsApp approval mandatory?", a: "No. In-app and email approvals are the default. An independent WhatsApp Business Cloud API channel may be added later, with its own approved business credentials and user consent." },
  { q: "Can our agency manage different client brands?", a: "Multi-brand workspaces, client-only approver roles and usage limits are in the product plan. These features are not yet available in the foundation preview." },
  { q: "Are AI images free without limits?", a: "No. The proposed launch uses available free inference allowances, metered by tenant. Once quotas run out, generation should stop or use a deterministic template fallback." },
  { q: "Can I pay for a subscription today?", a: "Not yet. Published plan descriptions are illustrative. Customer billing and public registration will open only after the service is ready and a supported payment arrangement is verified." },
] as const;

export const plans = [
  { name: "Starter", subtitle: "For a single growing brand", features: ["1 brand workspace", "Content calendar", "AI-assisted drafts with quotas", "In-app and email approvals", "Eligible social connectors"], featured: false },
  { name: "Growth", subtitle: "For teams planning ahead", features: ["More social channels", "Multi-user review workflow", "Recurring content rules", "Extra AI generation allowances", "Analytics as supported"], featured: true },
  { name: "Agency", subtitle: "For multi-brand operations", features: ["Multiple client brands", "Client approver roles", "Separate brand workflows", "Team permissions", "Consolidated reporting"], featured: false },
] as const;
