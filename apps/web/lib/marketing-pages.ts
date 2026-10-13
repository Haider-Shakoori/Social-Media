export type MarketingPageContent = {
  eyebrow: string;
  title: string;
  summary: string;
  highlights: readonly { title: string; description: string; symbol: string }[];
  process: readonly { title: string; description: string }[];
  note: string;
};
export const marketingPages: Record<string, MarketingPageContent> = {
  features: {
    eyebrow: "A COMPLETE CONTENT WORKFLOW",
    title: "One workspace. A clearer way to manage your social content.",
    summary: "Move from disconnected drafts and approval messages to a single, accountable workflow for ideas, media, review, and publication. These are planned product capabilities, not a claim that every integration is already live.",
    highlights: [
      { symbol: "✦", title: "AI-assisted writing", description: "Draft branded captions, ideas, hashtags, and language variations while tracking usage." },
      { symbol: "▦", title: "Visual calendar", description: "See posts by date, target network, brand, approval status, and campaign." },
      { symbol: "✓", title: "Version-locked approval", description: "Tie approval to the exact caption, image, destination, and scheduled time." },
      { symbol: "◉", title: "Connection protection", description: "Respect permission checks, provider limits, failure handling, and pause controls." },
      { symbol: "↗", title: "Agency collaboration", description: "Organize brands, team responsibilities, and client review queues." },
      { symbol: "▤", title: "Clear reporting", description: "Show the metrics networks actually expose, with no invented growth predictions." },
    ],
    process: [
      { title: "Define the brand", description: "Give the platform your audience, tone, products, languages, and restricted topics." },
      { title: "Plan and create", description: "Generate draft content and arrange a publishable weekly calendar." },
      { title: "Approve and publish", description: "Review every version, then publish only to eligible connected accounts." },
    ],
    note: "Individual features will be enabled as they pass integration, security, and product testing.",
  },
  "ai-content": {
    eyebrow: "CONTENT THAT STARTS WITH YOUR BRAND",
    title: "Turn a simple brief into an editable content draft.",
    summary: "AI should save drafting time without replacing a customer's judgment. Generate options, refine tone, review visuals, and approve the final result before publishing.",
    highlights: [
      { symbol: "✦", title: "Caption variations", description: "Draft concise, friendly, promotional, or informative versions tailored to the platform." },
      { symbol: "▧", title: "Image studio", description: "Combine free-tier image generation with precise server-rendered typography and templates." },
      { symbol: "⌘", title: "Brand memory", description: "Use per-brand voice, colors, audience, language, and approved visual assets." },
      { symbol: "⇄", title: "Multilingual drafts", description: "Plan for English, Dari, Pashto, and Arabic with a deliberate review step." },
      { symbol: "◴", title: "Usage budgets", description: "Track AI credits and decline generation when free-tier or account limits are reached." },
      { symbol: "✓", title: "Human review", description: "Require verification of claims, text accuracy, prices, and sensitive religious content." },
    ],
    process: [
      { title: "Enter a brief", description: "Describe what to say, who the audience is, and what the visual should communicate." },
      { title: "Review drafts", description: "Choose a caption, edit it, and regenerate individual parts within your allowance." },
      { title: "Approve the final version", description: "Only the exact approved version becomes eligible for scheduled publication." },
    ],
    note: "Free AI usage is finite; production availability and supported models will be shown in the app.",
  },
  scheduling: {
    eyebrow: "CONTROLLED CONTENT AUTOMATION",
    title: "Set the plan once. Keep every post visible.",
    summary: "Plan recurring posts and specific occasions without losing control of timing or approval. Natural-language rules are translated into explicit settings that customers must confirm.",
    highlights: [
      { symbol: "◷", title: "Timezones first", description: "Store scheduling instants safely and display them in the customer's local timezone." },
      { symbol: "▦", title: "Calendar views", description: "Organize weeks, days, campaigns, and platform-specific destinations." },
      { symbol: "↺", title: "Recurring rules", description: "Examples include three posts weekly or a Friday 10 AM greeting." },
      { symbol: "✓", title: "Approval deadline", description: "A late or missing approval never silently causes a post to publish." },
      { symbol: "⊘", title: "Duplicate defense", description: "Prevent multiple worker retries from creating duplicate social posts." },
      { symbol: "⚑", title: "Recovery visibility", description: "Distinguish failed, delayed, uncertain, scheduled, and confirmed results." },
    ],
    process: [
      { title: "Describe the cadence", description: "Choose platforms, content themes, days, times, and brand." },
      { title: "Confirm the structured rule", description: "Validate a clear schedule; never activate ambiguous AI instructions." },
      { title: "Review scheduled results", description: "Receive approval notifications and a verifiable publishing outcome." },
    ],
    note: "Automatic publication is available only through a permitted, verified connector. Other networks retain an export/manual workflow.",
  },
  approvals: {
    eyebrow: "APPROVALS WITHOUT THE CHAOS",
    title: "The right post. The right approver. The right moment.",
    summary: "Make client approval an explicit step with a clear content preview, version history, deadline, and sender authentication.",
    highlights: [
      { symbol: "✓", title: "In-app approvals", description: "Review, approve, reject, or request edits from a secure dashboard." },
      { symbol: "✉", title: "Email review", description: "Use time-limited links with appropriate access checks and a delivery fallback." },
      { symbol: "↗", title: "Optional WhatsApp", description: "Use independently approved WhatsApp Business Cloud API notifications with explicit consent and unique request IDs." },
      { symbol: "▤", title: "Audit trail", description: "Record decisions, revision requests, timestamps, and approver identities." },
      { symbol: "⎋", title: "Approval expiry", description: "Block publishing if approval arrives too late or refers to an old version." },
      { symbol: "⌑", title: "Client roles", description: "Let invited client approvers review only their authorized brand content." },
    ],
    process: [
      { title: "Send a preview", description: "The approver receives the exact media, caption, platform, and schedule." },
      { title: "Record the decision", description: "Approve, reject, or request a change; invalidate stale approvals." },
      { title: "Publish on schedule", description: "A confirmed valid approval authorizes publishing only at the intended time." },
    ],
    note: "A plain 'Agree' message is ambiguous when multiple posts are pending; approvals need a unique reference.",
  },
  about: {
    eyebrow: "WHY THIS PRODUCT",
    title: "Built for predictable, human-controlled social content.",
    summary: "The goal is to reduce repetitive drafting and approval work without relying on hidden automation tricks or making unrealistic guarantees about account growth.",
    highlights: [
      { symbol: "▦", title: "One operating view", description: "Bring content planning, approvals, campaigns, and publication records into a single workspace." },
      { symbol: "⌁", title: "Practical automation", description: "Automate repeatable preparation while giving account owners the final say." },
      { symbol: "◉", title: "Honest availability", description: "Show which social connections are eligible, unavailable, or limited." },
    ],
    process: [
      { title: "Start narrow", description: "Validate core workflows with a controlled beta and the first eligible platforms." },
      { title: "Measure the outcome", description: "Track actual time saved, approvals, reliability, and retention." },
      { title: "Expand responsibly", description: "Add providers only after checking access, performance, and customer value." },
    ],
    note: "This product is currently in development. Product positioning and brand identity may evolve before launch.",
  },
};

export const solutions: Record<string, MarketingPageContent> = {
  agencies: {
    eyebrow: "FOR SOCIAL MEDIA AGENCIES",
    title: "Send less back-and-forth. Keep every client in the loop.",
    summary: "A content agency needs brand separation, assignable editors, client-only approvals, and a shared view of delivery. The planned agency workspace is organized around exactly that.",
    highlights: [
      { symbol: "▦", title: "Separate client brands", description: "Keep account connections, content history, logos, and approvals scoped to each client." },
      { symbol: "✓", title: "Client approvals", description: "Invite reviewers who need to approve work without giving access to other brands." },
      { symbol: "◷", title: "Shared calendar", description: "Coordinate upcoming drafts and scheduled posts across multiple client campaigns." },
    ],
    process: [
      { title: "Add each client", description: "Create a workspace and assign a brand profile and the appropriate roles." },
      { title: "Prepare weekly content", description: "Generate drafts and queue exact versions for client review." },
      { title: "Report and learn", description: "Show the client approvals, publishing record, and available performance metrics." },
    ],
    note: "Agency roles and reporting are on the roadmap, not part of the initial public-site foundation.",
  },
  businesses: {
    eyebrow: "FOR SMALL BUSINESSES",
    title: "Stay consistent without building a marketing department.",
    summary: "Turn a few brand guidelines into a repeatable content routine for promotions, occasions, and announcements, with the business owner approving each final post.",
    highlights: [
      { symbol: "✦", title: "Simple briefs", description: "Create content by describing a product, offer, occasion, or announcement." },
      { symbol: "▧", title: "Branded visuals", description: "Keep colors and logos consistent and render multilingual text accurately." },
      { symbol: "✓", title: "Owner approval", description: "Always see what's going out and when, before any eligible network publishes it." },
    ],
    process: [
      { title: "Tell us about your brand", description: "Define business products, language, audience, and posting preferences." },
      { title: "Build a content plan", description: "Set a manageable weekly calendar with flexible recurring events." },
      { title: "Review on your schedule", description: "Approve or request edits through the dashboard or configured notification method." },
    ],
    note: "The service aims to improve workflow consistency, not guarantee more followers or sales.",
  },
};
