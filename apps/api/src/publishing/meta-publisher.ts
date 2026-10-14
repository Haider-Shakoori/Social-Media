import {unseal} from '../social-oauth/oauth-crypto';
import type {MetaCredentials} from '../social-oauth/meta-account';
import {PublishOutcomeUnknown} from './publish-errors';
import {publishInstagramImage} from './instagram-image-publisher';
export {PublishOutcomeUnknown} from './publish-errors';

const BASE='https://graph.facebook.com/v26.0';
async function post(path:string,accessToken:string,values:Record<string,string>,
 fetcher:typeof fetch=fetch):Promise<string>{
 let response:Response;
 try{
  response=await fetcher(BASE+'/'+encodeURIComponent(path.split('/')[0])+
    (path.includes('/')?'/'+path.split('/').slice(1).join('/'):''),
    {method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
     headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/x-www-form-urlencoded'},
     body:new URLSearchParams(values)});
 }catch{throw new PublishOutcomeUnknown('network_or_timeout');}
 // Even a reported provider error could follow an accepted write: never blindly retry.
 if(!response.ok)throw new PublishOutcomeUnknown('provider_error');
 let data:unknown;
 try{data=await response.json();}catch{throw new PublishOutcomeUnknown('bad_response');}
 if(!data||typeof data!=='object'||!('id'in data)||typeof data.id!=='string'||!data.id){
  throw new PublishOutcomeUnknown('missing_remote_id');
 }
 return data.id;
}
export async function sendMetaPost(input:{
 platform:'facebook'|'instagram';accountId:string;encryptedCredentials:string;
 caption:string;mediaUrls:string[];
},fetcher:typeof fetch=fetch):Promise<string>{
 if(input.platform!=='facebook'&&input.platform!=='instagram')throw new PublishOutcomeUnknown('unsupported_network');
 const secrets=unseal<MetaCredentials>(input.encryptedCredentials);
 if(!secrets.accessToken)throw new PublishOutcomeUnknown('credentials_missing');
 // Business Login access tokens must ONLY be sent to graph.instagram.com.
 // This is independently gated even if the legacy Meta publisher is enabled.
 if(secrets.loginType==='instagram'){
  if(input.platform!=='instagram'||process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED!=='true')
   throw new PublishOutcomeUnknown('instagram_login_publishing_not_enabled');
  if(input.mediaUrls.length!==1)throw new PublishOutcomeUnknown('unsupported_media');
  return publishInstagramImage({accountId:input.accountId,accessToken:secrets.accessToken,
   caption:input.caption,imageUrl:input.mediaUrls[0]},fetcher);
 }
 if(input.platform==='facebook'){
  if(input.mediaUrls.length)throw new PublishOutcomeUnknown('unsupported_media');
  return post(input.accountId+'/feed',secrets.accessToken,
   {message:input.caption,published:'true'},fetcher);
 }
 if(input.mediaUrls.length!==1)throw new PublishOutcomeUnknown('unsupported_media');
 const media=new URL(input.mediaUrls[0]);
 if(media.protocol!=='https:'||media.username||media.password)throw new PublishOutcomeUnknown('invalid_media_url');
 // Instagram has two POST phases. Any uncertain outcome prevents all automatic retries.
 const container=await post(input.accountId+'/media',secrets.accessToken,
  {image_url:media.toString(),caption:input.caption},fetcher);
 return post(input.accountId+'/media_publish',secrets.accessToken,{creation_id:container},fetcher);
}
