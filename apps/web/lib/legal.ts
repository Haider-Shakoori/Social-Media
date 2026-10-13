export type DraftLegalPage={title:string;intro:string;sections:readonly {heading:string;body:string}[]};
export const draftLegalPages:Record<string,DraftLegalPage>={
 privacy:{title:"Privacy policy — draft",intro:"A final privacy notice must be legally reviewed before any public customer data collection. This is not an effective privacy policy.",sections:[
 {heading:"Planned processing",body:"When registrations open, account contact details, workspace data, brand settings, approved content, integration permissions and publishing records may be processed for operating the service."},
 {heading:"Social authorization",body:"We plan not to request social account passwords. Any permitted connection credentials will be encrypted, isolated and revocable."},
 {heading:"Vendors and retention",body:"A final policy must identify actual subprocessors, lawful basis, storage duration, international transfers and rights procedures."},
 ]},
 terms:{title:"Terms of service — draft",intro:"These are pre-launch notes, not binding terms. The final agreement requires legal review and operator approval.",sections:[
 {heading:"Scope",body:"The proposed software helps create, review, schedule and publish authorized content. Features depend on provider permissions and subscriptions."},
 {heading:"Customer responsibility",body:"Customers must have rights to accounts, images and content and must follow social platform policies."},
 {heading:"Service limits",body:"We do not guarantee follower growth, uninterrupted third-party API access, or freedom from account restrictions."},
 {heading:"Commercial terms",body:"Final plans, cancellation, liability, disputes and payment policies will be published before commercial launch."},
 ]},
 "acceptable-use":{title:"Acceptable use — draft",intro:"Planned safeguards, to be finalized before opening user registrations.",sections:[
 {heading:"Authorized access only",body:"Customers must control the accounts they connect and must not request unauthorized activity."},
 {heading:"No spam",body:"No harassment, unsolicited bulk engagement, fabricated followers, impersonation or deceptive campaigns."},
 {heading:"Respect provider limits",body:"Do not bypass authentication challenges, rate limits, restrictions or platform enforcement."},
 ]},
 cookies:{title:"Cookie policy — draft",intro:"The final policy will be based on an inventory of actual deployed cookies and tracking providers.",sections:[
 {heading:"Essential sessions",body:"Future authenticated sessions may use secure cookies for login and CSRF protection."},
 {heading:"Optional analytics",body:"Non-essential analytics will be reviewed for consent requirements before activation."},
 {heading:"Review",body:"Specific cookies, expiry periods, third parties and user controls will be published in the effective policy."},
 ]},
};
