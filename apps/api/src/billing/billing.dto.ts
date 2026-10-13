import {z} from 'zod';
const limit=z.number().int().min(0).max(10000000);
const money=z.number().int().min(0).max(2000000000).nullable();
export const planInput=z.strictObject({
 code:z.string().regex(/^[a-z][a-z0-9-]{1,59}$/),name:z.string().trim().min(2).max(100),
 description:z.string().trim().max(500).default(''),currency:z.string().regex(/^[A-Z]{3}$/).default('USD'),
 monthlyPriceMinor:money.default(null),yearlyPriceMinor:money.default(null),trialDays:z.number().int().min(0).max(90).default(0),
 maxBrands:limit,maxSeats:limit,maxConnections:limit,monthlyAiText:limit,monthlyAiImage:limit,monthlyScheduledPosts:limit,
 enabled:z.boolean().default(false),published:z.boolean().default(false),
});
export const planPatch=planInput.omit({code:true}).partial().refine(x=>Object.keys(x).length>0);
export const activateInput=z.strictObject({planCode:z.string().min(2).max(60),cycle:z.enum(['MONTHLY','YEARLY'])});
export const extendTrialInput=z.strictObject({days:z.number().int().min(1).max(90)});
export const invoiceInput=z.strictObject({tenantId:z.uuid(),planCode:z.string().max(60).optional(),
 amountMinor:z.number().int().min(1).max(2000000000),currency:z.string().regex(/^[A-Z]{3}$/),dueAt:z.iso.datetime().optional()});
export const paymentInput=z.strictObject({invoiceId:z.uuid(),reference:z.string().trim().min(3).max(120),
 note:z.string().trim().max(500).default('')});
export const decisionInput=z.strictObject({decision:z.enum(['VERIFY','REJECT'])});
