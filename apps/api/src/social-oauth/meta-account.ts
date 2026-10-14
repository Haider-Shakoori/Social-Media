import {createHash} from 'node:crypto';

/** Meta-only, operator-gated account maintenance. No browser cookies or unofficial sessions. */
const GRAPH='https://graph.facebook.com/v26.0';
const IG_GRAPH='https://graph.instagram.com';
export type MetaPlatform='facebook'|'instagram';
export type MetaCredentials={accessToken:string;userAccessToken?:string;refreshToken?:string;loginType?:'facebook'|'instagram'};
export type MetaAccount={platform:MetaPlatform;externalAccountId:string;credentials:MetaCredentials;expiresAt:Date|null};
export type MetaHealth={state:'CONNECTED'|'LIMITED'|'RESTRICTED';reason:string;grantedScopes:string[];missingScopes:string[]};
export type MetaRefresh={credentials:MetaCredentials;expiresAt:Date|null;health:MetaHealth};
export const requiredMetaScopes=(p:MetaPlatform,loginType?:'facebook'|'instagram'):string[]=>loginType==='instagram'
 ? ['instagram_business_basic','instagram_business_content_publish'] : p==='facebook'
 ? ['pages_manage_posts','pages_read_engagement']
 : ['instagram_basic','instagram_content_publish'];

export function metaScopeHealth(platform:MetaPlatform,granted:string[],tokenValid=true,
 loginType?:'facebook'|'instagram'):MetaHealth {
 const clean=[...new Set(granted.filter(x=>typeof x==='string'))];
 const missing=requiredMetaScopes(platform,loginType).filter(scope=>!clean.includes(scope));
 return {state:!tokenValid?'RESTRICTED':missing.length?'LIMITED':'CONNECTED',
  reason:!tokenValid?'token_invalid':missing.length?'missing_permissions':'ready_for_review',
  grantedScopes:clean,missingScopes:missing};
}
export class MetaAccessError extends Error {
 constructor(readonly kind:'restricted'|'temporary'|'invalid_response') {
  super(kind==='restricted'?'Meta authorization must be renewed':kind==='temporary'?'Meta temporarily unavailable':'Unexpected Meta response');
 }
}
type JsonRecord=Record<string,unknown>;
async function metaGet(path:string,token:string,search:Record<string,string>={},fetcher:typeof fetch=fetch):Promise<JsonRecord>{
 const url=new URL(GRAPH+path);
 for(const [k,v] of Object.entries(search))url.searchParams.set(k,v);
 let response:Response;
 try{response=await fetcher(url.toString(),{method:'GET',
  headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000),redirect:'error'});}
 catch{throw new MetaAccessError('temporary');}
 if(response.status===401||response.status===403)throw new MetaAccessError('restricted');
 if(!response.ok)throw new MetaAccessError('temporary');
 try { const data:unknown=await response.json();
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('object required');
  return data as JsonRecord;
 }catch{throw new MetaAccessError('invalid_response');}
}
async function igGet(path:string,token:string,search:Record<string,string>={},fetcher:typeof fetch=fetch):Promise<JsonRecord>{
 const url=new URL(IG_GRAPH+path);
 for(const [key,value] of Object.entries(search))url.searchParams.set(key,value);
 let response:Response;
 try{response=await fetcher(url.toString(),{method:'GET',redirect:'error',signal:AbortSignal.timeout(12000),
  headers:{Authorization:'Bearer '+token}});}
 catch{throw new MetaAccessError('temporary');}
 if(response.status===401||response.status===403)throw new MetaAccessError('restricted');
 if(!response.ok)throw new MetaAccessError('temporary');
 try{
  const data:unknown=await response.json();
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('object required');
  return data as JsonRecord;
 }catch{throw new MetaAccessError('invalid_response');}
}
async function scopesFor(userToken:string,fetcher:typeof fetch):Promise<string[]> {
 const data=await metaGet('/me/permissions',userToken,{limit:'100'},fetcher);
 if(!Array.isArray(data.data))throw new MetaAccessError('invalid_response');
 return data.data.filter((v):v is {permission:string;status:string}=>Boolean(v)&&
  typeof v==='object'&&typeof v.permission==='string'&&v.status==='granted').map(x=>x.permission);
}
function assertIdentity(data:JsonRecord,id:string):void{
 if(data.id!==id)throw new MetaAccessError('restricted');
}
/** Does not return any secret, refresh by itself or authorize posting. */
export async function inspectMetaAccount(input:MetaAccount,fetcher:typeof fetch=fetch):Promise<MetaHealth>{
 const {platform,externalAccountId,credentials,expiresAt}=input;
 if(credentials.loginType==='instagram'){
  if(platform!=='instagram'||!credentials.accessToken)return metaScopeHealth(platform,[],false,'instagram');
  if(expiresAt&&expiresAt.getTime()<=Date.now())return metaScopeHealth(platform,[],false,'instagram');
  const identity=await igGet('/me',credentials.accessToken,{fields:'id,username,account_type'},fetcher);
  assertIdentity(identity,externalAccountId);
  // Instagram Login does not provide Facebook's /me/permissions interface.
  // The token-bound /me identity is valid but scopes have NOT been determined:
  // do not claim a permission was denied or is missing. Remain LIMITED.
  return {state:'LIMITED',reason:'permissions_unverified',grantedScopes:[],missingScopes:[]};
 }
 if(!credentials.userAccessToken) return metaScopeHealth(platform,[],false);
 if(expiresAt&&expiresAt.getTime()<=Date.now())return metaScopeHealth(platform,[],false);
 const [granted,identity]=await Promise.all([
  scopesFor(credentials.userAccessToken,fetcher),
  metaGet('/'+encodeURIComponent(externalAccountId),credentials.accessToken,
   {fields:platform==='facebook'?'id,name':'id,username'},fetcher),
 ]);
 assertIdentity(identity,externalAccountId);
 return metaScopeHealth(platform,granted);
}
/** Refreshes only an authorized existing Meta account; must never swap to a different page/IG identity. */
export async function refreshMetaAccount(input:MetaAccount,fetcher:typeof fetch=fetch):Promise<MetaRefresh>{
 if(input.credentials.loginType==='instagram'){
  if(input.platform!=='instagram'||!input.credentials.accessToken)throw new MetaAccessError('restricted');
  if(input.expiresAt&&input.expiresAt.getTime()<=Date.now())throw new MetaAccessError('restricted');
  // Instagram refresh is permitted only for eligible, unexpired long-lived tokens.
  const response=await igGet('/refresh_access_token',input.credentials.accessToken,{
   grant_type:'ig_refresh_token',access_token:input.credentials.accessToken},fetcher);
  if(typeof response.access_token!=='string'||response.access_token.length<10||
   typeof response.expires_in!=='number'||response.expires_in<=0)
   throw new MetaAccessError('invalid_response');
  const credentials:MetaCredentials={accessToken:response.access_token,loginType:'instagram'};
  const expiresAt=new Date(Date.now()+response.expires_in*1000);
  const health=await inspectMetaAccount({...input,credentials,expiresAt},fetcher);
  return {credentials,expiresAt,health};
 }
 const {META_APP_ID:id,META_APP_SECRET:secret}=process.env;
 if(!id||!secret||!input.credentials.userAccessToken)throw new MetaAccessError('restricted');
 const tokens=await metaGet('/oauth/access_token',input.credentials.userAccessToken,{
  grant_type:'fb_exchange_token',client_id:id,client_secret:secret,
  fb_exchange_token:input.credentials.userAccessToken},fetcher);
 if(typeof tokens.access_token!=='string'||tokens.access_token.length<10)throw new MetaAccessError('invalid_response');
 const longToken=tokens.access_token;
 const pages=await metaGet('/me/accounts',longToken,{
  fields:'id,name,access_token,instagram_business_account{id,username}',limit:'100'
 },fetcher);
 if(!Array.isArray(pages.data))throw new MetaAccessError('invalid_response');
 const chosen=pages.data.find((p:unknown)=>{
  if(!p||typeof p!=='object')return false;
  const item=p as {id?:string;instagram_business_account?:{id?:string}};
  return input.platform==='facebook'?item.id===input.externalAccountId:
   item.instagram_business_account?.id===input.externalAccountId;
 }) as {id?:string;access_token?:string}|undefined;
 if(!chosen||typeof chosen.access_token!=='string'||!chosen.access_token)throw new MetaAccessError('restricted');
 const expiresAt=typeof tokens.expires_in==='number'&&tokens.expires_in>0?
  new Date(Date.now()+tokens.expires_in*1000):null;
 const credentials:MetaCredentials={accessToken:chosen.access_token,userAccessToken:longToken};
 const health=await inspectMetaAccount({...input,credentials,expiresAt},fetcher);
 return {credentials,expiresAt,health};
}
