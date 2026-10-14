import {isIP} from 'node:net';
import {PublishOutcomeUnknown} from './publish-errors';

const GRAPH='https://graph.instagram.com/v26.0';
const idPattern=/^[A-Za-z0-9_-]{3,255}$/;

/** Instagram Login only. Never use a Facebook Page token or graph.facebook.com here. */
export function assertPublishableInstagramImage(urlText:string):string {
 let url:URL;
 try{url=new URL(urlText);}catch{throw new PublishOutcomeUnknown('invalid_media_url');}
 const host=url.hostname.toLowerCase();
 if(url.protocol!=='https:'||url.username||url.password||url.port||
  isIP(host)!==0||host==='localhost'||host.endsWith('.localhost')||
  host.endsWith('.local')||host.endsWith('.internal')||!host.includes('.')){
  throw new PublishOutcomeUnknown('invalid_media_url');
 }
 // Meta fetches these URLs directly; no data: URLs, file: paths or private hosts.
 return url.toString();
}
function endpoint(id:string,edge=''):string {
 if(!idPattern.test(id))throw new PublishOutcomeUnknown('invalid_instagram_identifier');
 return GRAPH+'/'+encodeURIComponent(id)+(edge?'/'+edge:'');
}
async function request(url:string,token:string,method:'GET'|'POST',
 params?:URLSearchParams,fetcher:typeof fetch=fetch):Promise<Record<string,unknown>> {
 let response:Response;
 try{
  response=await fetcher(url,{method,redirect:'error',signal:AbortSignal.timeout(20000),
   headers:{Authorization:'Bearer '+token,...(params?{'Content-Type':'application/x-www-form-urlencoded'}:{})},
   ...(params?{body:params}:{}),
  });
 }catch{throw new PublishOutcomeUnknown('instagram_network_or_timeout');}
 // A provider error after a write could still be uncertain; do not automatically retry.
 if(!response.ok)throw new PublishOutcomeUnknown('instagram_provider_error');
 try{
  const json=await response.json() as unknown;
  if(!json||typeof json!=='object'||Array.isArray(json))throw Error('invalid');
  return json as Record<string,unknown>;
 }catch{throw new PublishOutcomeUnknown('instagram_invalid_response');}
}
const remoteId=(data:Record<string,unknown>)=>{
 const id=data.id;
 if(typeof id!=='string'||!idPattern.test(id))throw new PublishOutcomeUnknown('instagram_missing_remote_id');
 return id;
};
export type InstagramImageInput={
 accountId:string;accessToken:string;caption:string;imageUrl:string;
};
export async function instagramImageContainerStatus(id:string,token:string,
 fetcher:typeof fetch=fetch):Promise<'FINISHED'|'IN_PROGRESS'|'ERROR'|'EXPIRED'|'PUBLISHED'|'UNKNOWN'>{
 const url=new URL(endpoint(id));
 url.searchParams.set('fields','id,status_code');
 const value=await request(url.toString(),token,'GET',undefined,fetcher);
 if(value.id!==id)throw new PublishOutcomeUnknown('instagram_container_identity_mismatch');
 const status=value.status_code;
 return status==='FINISHED'||status==='IN_PROGRESS'||status==='ERROR'||
  status==='EXPIRED'||status==='PUBLISHED'?status:'UNKNOWN';
}
/** Returns a remote media ID only after Instagram confirms a successful publish response.
 * Any ambiguous outcome is treated as UNCERTAIN by the existing publishing worker.
 */
export async function publishInstagramImage(input:InstagramImageInput,
 fetcher:typeof fetch=fetch,
 pause:(ms:number)=>Promise<void>=(ms)=>new Promise(resolve=>setTimeout(resolve,ms))):Promise<string>{
 if(!input.accessToken||input.accessToken.length<10)throw new PublishOutcomeUnknown('instagram_credentials_missing');
 if(input.caption.length>2200)throw new PublishOutcomeUnknown('instagram_caption_too_long');
 const imageUrl=assertPublishableInstagramImage(input.imageUrl);
 const media=await request(endpoint(input.accountId,'media'),input.accessToken,'POST',
  new URLSearchParams({image_url:imageUrl,caption:input.caption}),fetcher);
 const containerId=remoteId(media);
 for(let attempt=0;attempt<5;attempt++){
  const status=await instagramImageContainerStatus(containerId,input.accessToken,fetcher);
  if(status==='FINISHED'){
   const result=await request(endpoint(input.accountId,'media_publish'),input.accessToken,'POST',
    new URLSearchParams({creation_id:containerId}),fetcher);
   return remoteId(result);
  }
  if(status==='ERROR'||status==='EXPIRED'||status==='PUBLISHED')
   throw new PublishOutcomeUnknown('instagram_container_'+status.toLowerCase());
  if(attempt<4)await pause(3000);
 }
 // We can't assume Meta didn't accept the container; never auto-publish twice.
 throw new PublishOutcomeUnknown('instagram_container_not_ready');
}
/** Read-only reconciliation of a known remote ID; never creates or republishes media. */
export async function verifyInstagramPublishedImage(remoteId:string,accessToken:string,
 fetcher:typeof fetch=fetch):Promise<boolean>{
 try{
  const url=new URL(endpoint(remoteId));
  url.searchParams.set('fields','id,media_type,permalink');
  const result=await request(url.toString(),accessToken,'GET',undefined,fetcher);
  return result.id===remoteId&&result.media_type==='IMAGE'&&
   typeof result.permalink==='string'&&result.permalink.startsWith('https://www.instagram.com/');
 }catch{return false;}
}
