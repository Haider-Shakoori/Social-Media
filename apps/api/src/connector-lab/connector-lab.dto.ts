import {z} from 'zod';
export const accountKey=z.string().trim().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/);
export const proxyKey=accountKey.nullable();
export const createAccount=z.strictObject({accountKey,proxyKey:proxyKey.optional()});
export const updateAccount=z.strictObject({proxyKey});
export const requestTest=z.strictObject({
 accountId:z.uuid(),driver:z.enum(['playwright','patchright']),
});
export const heartbeat=z.strictObject({
 maxSessions:z.literal(1),
 workerMode:z.literal('read_only'),
 agentVersion:z.string().regex(/^[A-Za-z0-9._-]{1,40}$/),
 proxyKeys:z.array(accountKey).max(100),
});
export const testResult=z.strictObject({
 jobId:z.uuid(),state:z.enum(['SUCCEEDED','FAILED']),
 title:z.string().max(160).optional(),
 failureCode:z.enum(['browser_unavailable','page_unavailable','proxy_unavailable','test_failed']).optional(),
});
