import {unseal} from '../social-oauth/oauth-crypto';
import type {MetaCredentials} from '../social-oauth/meta-account';

/** Read-only check for a known Facebook post. Unknown outcomes with no remote ID remain UNCERTAIN. */
export async function verifyFacebookRemote(input:{remoteId:string;pageId:string;encryptedCredentials:string},
 fetcher:typeof fetch=fetch):Promise<boolean>{
 if(!/^[A-Za-z0-9_:-]{3,255}$/.test(input.remoteId))return false;
 const {accessToken}=unseal<MetaCredentials>(input.encryptedCredentials);
 if(!accessToken)return false;
 const url=new URL('https://graph.facebook.com/v26.0/'+encodeURIComponent(input.remoteId));
 url.searchParams.set('fields','id,from');
 try{
  const response=await fetcher(url.toString(),{method:'GET',redirect:'error',
   signal:AbortSignal.timeout(10000),headers:{Authorization:'Bearer '+accessToken}});
  if(!response.ok)return false;
  const result=await response.json() as {id?:string;from?:{id?:string}};
  return result.id===input.remoteId&&result.from?.id===input.pageId;
 }catch{return false;}
}
