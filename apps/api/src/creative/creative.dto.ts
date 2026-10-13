import {z} from 'zod';
export const creativeInput=z.strictObject({
  topic:z.string().trim().min(5).max(500),
  language:z.enum(['en','fa-AF','ps','ar']).default('en'),
  destination:z.enum(['facebook','instagram','x']),
  format:z.enum(['announcement','educational','promotion','question']).default('announcement'),
});
export const imageInput=z.strictObject({
  headline:z.string().trim().min(3).max(110),
  subtitle:z.string().trim().max(200).default(''),
  variant:z.enum(['square','landscape','portrait']).default('square'),
});
