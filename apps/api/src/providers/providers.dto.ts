import { z } from 'zod';
export const policyUpdateInput=z.strictObject({
 rolloutState:z.enum(['PLANNED','MANUAL_ONLY','AWAITING_APPROVAL','TESTING','RESTRICTED','DISABLED']),
 operatorEnabled:z.boolean().optional(),
 notes:z.string().trim().max(500).optional(),
}).refine(value=>Object.keys(value).length>0);
export const manualExportInput=z.strictObject({
 network:z.enum(['instagram','facebook','threads','pinterest','linkedin','tiktok','youtube','google_business_profile','x','reddit']),
 contentType:z.enum(['text','image','video','carousel','document','pin','local_post']),
 caption:z.string().trim().min(1).max(5000),
 mediaUrls:z.array(z.url().max(1000)).max(12).default([]),
 destinationNote:z.string().trim().max(200).optional(),
});
