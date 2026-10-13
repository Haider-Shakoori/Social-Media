import {z} from 'zod';
export const oauthNetwork=z.enum(['meta','x']);
export const chosenAccount=z.strictObject({accountId:z.string().min(1).max(255),platform:z.enum(['facebook','instagram','x'])});
export const attemptId=z.uuid();
