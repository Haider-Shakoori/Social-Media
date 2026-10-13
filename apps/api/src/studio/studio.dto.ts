import {z} from 'zod';
const url=z.url().startsWith('https://').max(1000);
export const contentInput=z.strictObject({caption:z.string().trim().min(1).max(5000),mediaUrls:z.array(url).max(12).default([]),
 language:z.literal('en').default('en'),campaignId:z.uuid().optional()});
export const versionInput=contentInput.omit({campaignId:true}).extend({expectedVersion:z.number().int().min(1)});
export const campaignInput=z.strictObject({name:z.string().trim().min(2).max(150),description:z.string().trim().max(500).default('')});
export const mediaInput=z.strictObject({url,mimeType:z.enum(['image/png','image/jpeg','image/webp','video/mp4']),altText:z.string().trim().max(500).default('')});
