import {createHash} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';

export type InspectionRequest = { accountKey:string; targetUrl:string; driver:'playwright'|'patchright' };
export type InspectionResult = {status:'completed'; accountKey:string; origin:string; title:string; checkedAt:string; driver:string};
const keyPattern=/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/;
export function requireLabEnabled(env:NodeJS.ProcessEnv=process.env):void{
 if(env.EXPERIMENTAL_BROWSER_LAB_ENABLED!=='true')throw new Error('Experimental browser lab is disabled');
}
export function allowedOrigins(env:NodeJS.ProcessEnv=process.env):Set<string>{
 const raw=env.BROWSER_LAB_ALLOWED_ORIGINS||'';
 const result=new Set<string>();
 for(const part of raw.split(',').map(v=>v.trim()).filter(Boolean)){
  const u=new URL(part);
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)
   throw new Error('Allowed origins must be bare HTTP(S) origins');
  if(u.protocol!=='https:' && !['localhost','127.0.0.1'].includes(u.hostname))
   throw new Error('Only localhost may use insecure HTTP');
  result.add(u.origin);
 }
 return result;
}
export function assertAllowedRequest(input:InspectionRequest,env:NodeJS.ProcessEnv=process.env):URL{
 requireLabEnabled(env);
 if(!keyPattern.test(input.accountKey)||input.accountKey==='.'||input.accountKey==='..')
  throw new Error('Invalid account key');
 if(!['patchright','playwright'].includes(input.driver))throw new Error('Unsupported browser driver');
 const url=new URL(input.targetUrl);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.hash)
  throw new Error('Only clean HTTP(S) URLs permitted');
 const list=allowedOrigins(env);
 if(list.size===0||!list.has(url.origin))throw new Error('Browser navigation origin not approved');
 return url;
}
export function accountDirectory(basePath:string,accountKey:string):string{
 if(!keyPattern.test(accountKey))throw new Error('Invalid account key');
 const base=resolve(basePath);
 const name=createHash('sha256').update(accountKey).digest('hex');
 const dir=resolve(join(base,name));
 if(!dir.startsWith(base+sep))throw new Error('Invalid account directory');
 return dir;
}
export async function createAccountDirectory(basePath:string,accountKey:string):Promise<string>{
 const dir=accountDirectory(basePath,accountKey);
 await mkdir(dir,{recursive:true,mode:0o700});
 return dir;
}
