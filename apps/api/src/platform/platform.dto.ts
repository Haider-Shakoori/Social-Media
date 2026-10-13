import { z } from 'zod';

const section=z.strictObject({
  heading:z.string().trim().min(2).max(150),
  body:z.string().trim().min(10).max(12000),
});
export const cmsEntryInput=z.strictObject({
  type:z.enum(['ARTICLE','GUIDE','PAGE']),
  locale:z.literal('en').default('en'),
  slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(100),
  title:z.string().trim().min(6).max(180),
  description:z.string().trim().min(15).max(500),
  category:z.string().trim().min(2).max(80),
  readingTime:z.string().trim().min(2).max(30).default('4 min'),
  sections:z.array(section).min(1).max(30),
});
export const cmsEntryPatch=cmsEntryInput.omit({type:true,locale:true,slug:true}).partial()
  .refine(value=>Object.keys(value).length>0);
export const cmsRevisionInput=z.strictObject({expectedRevision:z.number().int().min(1)});
export const cmsEditInput=cmsEntryPatch.and(cmsRevisionInput);
export const listCmsQuery=z.strictObject({
  type:z.enum(['ARTICLE','GUIDE','PAGE']).optional(),
  status:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).optional(),
  locale:z.literal('en').optional(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
});
export const pageQuery=z.strictObject({page:z.coerce.number().int().min(1).max(10000).default(1)});
export const platformSettingInput=z.strictObject({
  key:z.enum(['cms_public_enabled','support_email','maintenance_notice','global_social_pause']),
  value:z.union([z.boolean(),z.string().max(500)]),
});
export function settingValue(key:string,value:boolean|string):boolean|string {
  if(key==='cms_public_enabled'||key==='global_social_pause'){
    if(typeof value!=='boolean')throw new Error('CMS public flag must be boolean');
    return value;
  }
  if(typeof value!=='string')throw new Error('Setting must be a string');
  if(key==='support_email'&&value!==''&&!z.email().safeParse(value).success)throw new Error('Invalid support email');
  return value.trim();
}
