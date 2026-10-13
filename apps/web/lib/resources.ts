export type Resource = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  sections: readonly { heading: string; body: string }[];
};

export const articles: readonly Resource[] = [
  {
    slug: "approval-first-content-workflows",
    title: "Why every AI social post needs a clear approval step",
    description: "A practical blueprint for reviewing AI-assisted drafts without turning approvals into a bottleneck.",
    category: "Workflow guide",
    readingTime: "4 min read",
    sections: [
      { heading: "Separate drafting from publishing", body: "AI-generated content is a starting point. Keep every caption and image as an editable draft until a designated human approves the exact version for a particular destination." },
      { heading: "Show the whole context", body: "A useful approval request contains the media, full caption, target account, scheduled time, and a clear approve, reject, or revise action. Missing context creates unnecessary clarification rounds." },
      { heading: "Make revisions safe", body: "An approved image should not be silently replaced. Any meaningful content change should produce a new version and invalidate an earlier approval." },
      { heading: "Plan for late replies", body: "Define the deadline in advance. Missing, ambiguous, or late approval should never result in an unexpected publication. Rescheduling is often safer than automatically posting late." },
    ],
  },
  {
    slug: "social-publishing-connection-safety",
    title: "What safe social account connections actually mean",
    description: "Understand the difference between an approved publishing integration, an unsupported browser session, and manual publishing.",
    category: "Account protection",
    readingTime: "5 min read",
    sections: [
      { heading: "Authorization is more than a login", body: "An account owner's login does not automatically authorize a third-party application to publish through private platform interfaces. Confirm the platform's developer and commercial rules." },
      { heading: "Prefer supported capabilities", body: "A proper connector reports its permitted account types, content formats, permissions, and restrictions. If a feature is not supported, the software should display that clearly." },
      { heading: "Handle failure deliberately", body: "Expired credentials, posting restrictions, and upstream outages are normal operational cases. Stop affected jobs and provide recovery instructions rather than endlessly retrying." },
      { heading: "Manual can be the right fallback", body: "For a network without eligible API access, producing a high-quality draft for a person to publish manually is better than claiming an unsafe automation technique will always work." },
    ],
  },
  {
    slug: "designing-english-social-content",
    title: "Designing readable English social content with branded visuals",
    description: "A repeatable approach for combining AI draft text with accurate branded image templates.",
    category: "Creative operations",
    readingTime: "3 min read",
    sections: [
      { heading: "Review the language", body: "English AI drafts need human verification for factual claims, names, prices, brand tone and quotations." },
      { heading: "Generate backgrounds separately", body: "Image models can struggle with overlaid lettering and precise spelling. Create or select the visual background first, then render approved text through a deterministic font and layout engine." },
      { heading: "Build reusable templates", body: "Save logo safe zones, typography, color palettes, image sizes, and contrast standards as brand templates. This improves consistency and reduces unnecessary AI inference." },
    ],
  },
];

export const guides: readonly Resource[] = [
  {
    slug: "getting-started",
    title: "Getting started: the planned workspace flow",
    description: "Understand the planned onboarding journey for a brand workspace.",
    category: "Onboarding",
    readingTime: "3 min",
    sections: [
      { heading: "1. Create a workspace", body: "When registration opens, an organization will create a tenant workspace and invite team members with limited roles." },
      { heading: "2. Configure a brand", body: "Enter your industry, timezone, audience, English content style, preferred themes, logo and other reusable assets." },
      { heading: "3. Check connection eligibility", body: "Select a network and follow its authorized connection process when available. Manual publishing will remain an option for unsupported networks." },
      { heading: "4. Plan and approve", body: "Create a content rule, generate a draft, assign an approver, and inspect the scheduled outcome." },
    ],
  },
  {
    slug: "approval-safety",
    title: "How post approvals will work",
    description: "Version checks, identity matching, scheduled times, and fallback behavior.",
    category: "Approval",
    readingTime: "4 min",
    sections: [
      { heading: "Immutable review version", body: "The approval binds to a post version with a full caption, image, destination and scheduled time." },
      { heading: "Email and in-app first", body: "The dashboard and email workflow are the planned reliable base. WhatsApp is optional and can fail independently without stopping the rest of the system." },
      { heading: "Unique response identity", body: "Every approval request receives an identifier. A reply such as AGREE 1042 must match an active request and an authorized approver." },
      { heading: "Publish at the intended time", body: "Approval does not mean immediate posting. The content is eligible to publish at the scheduled time after a final permission check." },
    ],
  },
  {
    slug: "provider-statuses",
    title: "Understanding social connector availability",
    description: "Why some networks will show planned, manual-only, or review-required status.",
    category: "Integrations",
    readingTime: "3 min",
    sections: [
      { heading: "Production-ready", body: "A connector can only be marked production-ready after the necessary access, permission review, real-account tests, and safety checks have been completed." },
      { heading: "Review required", body: "A provider may support an API technically but still restrict third-party commercial use or require an audit." },
      { heading: "Manual fallback", body: "When publishing through an official authorized integration is not available, the app can prepare and export drafts for a person to post manually." },
      { heading: "Experimental", body: "Unofficial session-based integrations are isolated and disabled for commercial customers by default. There is no promise of ban-proof browser automation." },
    ],
  },
];
