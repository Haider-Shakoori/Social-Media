import {unseal} from '../social-oauth/oauth-crypto';
import type {MetaCredentials} from '../social-oauth/meta-account';

/**
 * Official Instagram Login image publisher. Disabled in deployments until
 * separate operator, Meta-review, connection, tenant, approved-version and
 * verified-permission gates are enabled. Never accept client-supplied tokens.
 *
 * Instagram fetches the image from a publicly readable HTTPS URL. Uploading
 * the original file to private durable storage is a separate prerequisite.
 */
const BASE='https://graph.instagram.com/v26.0';
export class InstagramPublishUncertain extends Error {
 constructor(readonly reason:string){super('Instagram publishing outcome requires operator review');}
}
const ident=/^[A-Za-z0-9_:-]{3,200}$/;
function validImageUrl(raw:string):boolean{
 try{
  const url=new URL(raw);
  if(url.protocol!=='https:'||url.username||url.password||url.hash)return false;
  if(!/\.(jpe?g)$/i.test(url.pathname))return false;
  const host=url.hostname.toLowerCase();
  if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||
   /^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(':')||host==='metadata.google.internal')return false;
  return true;
 }catch{return false;}
}
type ResponseShape={id?:string;status_code?:string;permalink?:string};
async function call(method:'GET'|'POST',path:string,token:string,
 data:Record<string,string>,fetcher:typeof fetch):Promise<ResponseShape>{
 const url=new URL(BASE+'/'+path);
 let options:RequestInit={method,redirect:'error',signal:AbortSignal.timeout(20000),
  headers:{Authorization:'Bearer '+token}};
 if(method==='GET')for(const [k,v] of Object.entries(data))url.searchParams.set(k,v);
 else options={...options,headers:{...options.headers,'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams(data)};
 let response:Response;
 try{response=await fetcher(url.toString(),options);}
 catch{throw new InstagramPublishUncertain('provider_network_or_timeout');}
 if(!response.ok)throw new InstagramPublishUncertain('provider_unsuccessful');
 let parsed:unknown;
 try{parsed=await response.json();}catch{throw new InstagramPublishUncertain('provider_invalid_response');}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new InstagramPublishUncertain('provider_invalid_response');
 return parsed as ResponseShape;
}
export async function sendInstagramImage(input:{
 accountId:string;encryptedCredentials:string;caption:string;imageUrl:string;grantedScopes:string[];
},fetcher:typeof fetch=fetch,sleep:(ms:number)=>Promise<void>=ms=>
 new Promise(resolve=>setTimeout(resolve,ms))):Promise<{mediaId:string;containerId:string}>{
 if(process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED!=='true')
  throw new InstagramPublishUncertain('image_publishing_disabled');
 if(!ident.test(input.accountId)||!validImageUrl(input.imageUrl)||input.caption.length>2200)
  throw new InstagramPublishUncertain('invalid_image_or_account');
 if(!['instagram_business_basic','instagram_business_content_publish'].every(s=>input.grantedScopes.includes(s)))
  throw new InstagramPublishUncertain('permission_not_verified');
 const credentials=unseal<MetaCredentials>(input.encryptedCredentials);
 if(credentials.loginType!=='instagram'||!credentials.accessToken)
  throw new InstagramPublishUncertain('instagram_login_credentials_required');
 const container=await call('POST',encodeURIComponent(input.accountId)+'/media',credentials.accessToken,
  {image_url:input.imageUrl,caption:input.caption},fetcher);
 if(!container.id||!ident.test(container.id))throw new InstagramPublishUncertain('container_id_missing');
 // The media container can take time to process. Do not publish until FINISHED.
 // Status checks are read-only; write calls are never retried.
 let ready=false;
 for(let i=0;i<10;i++){
  const state=await call('GET',encodeURIComponent(container.id),credentials.accessToken,
   {fields:'status_code'},fetcher);
  if(state.status_code==='FINISHED'){ready=true;break;}
  if(state.status_code==='ERROR'||state.status_code==='EXPIRED')
   throw new InstagramPublishUncertain('container_processing_failed');
  if(state.status_code!=='IN_PROGRESS'&&state.status_code!=='PUBLISHED')
   throw new InstagramPublishUncertain('container_status_unexpected');
  if(i<9)await sleep(3000);
 }
 if(!ready)throw new InstagramPublishUncertain('container_not_ready');
 const result=await call('POST',encodeURIComponent(input.accountId)+'/media_publish',
  credentials.accessToken,{creation_id:container.id},fetcher);
 if(!result.id||!ident.test(result.id))throw new InstagramPublishUncertain('publish_result_unknown');
 return {mediaId:result.id,containerId:container.id};
}
/** Read-only receipt verification. Never retries the publish POST. */
export async function verifyInstagramMedia(input:{remoteId:string;encryptedCredentials:string},
 fetcher:typeof fetch=fetch):Promise<boolean>{
 if(!ident.test(input.remoteId))return false;
 const {accessToken,loginType}=unseal<MetaCredentials>(input.encryptedCredentials);
 if(loginType!=='instagram'||!accessToken)return false;
 try{
  const result=await call('GET',encodeURIComponent(input.remoteId),accessToken,
   {fields:'id,permalink'},fetcher);
  return result.id===input.remoteId;
 }catch{return false;}
}
