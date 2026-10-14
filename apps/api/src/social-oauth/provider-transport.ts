import { BadGatewayException } from '@nestjs/common';
import { challenge } from './oauth-crypto';

export type OAuthNetwork='meta'|'instagram'|'x';
export type PendingAccount={
 platform:'facebook'|'instagram'|'x';id:string;name:string;
 accessToken:string;refreshToken?:string;userAccessToken?:string;expiresAt?:string;scopes:string[];loginType?:'instagram'|'facebook';
};
export type AccountResponse={accounts:PendingAccount[]};

const GRAPH_VERSION='v26.0';
function requireConfig(...keys:string[]){
 for(const k of keys)if(!process.env[k])throw new Error('Missing '+k+' environment variable');
}
function callbackUri(value:string){
 const url=new URL(value);
 if(url.username||url.password||url.hash||url.search||
   (url.protocol!=='https:'&&!(url.protocol==='http:'&&url.hostname==='localhost'))){
  throw new Error('OAuth callback must be HTTPS (localhost HTTP allowed only in development)');
 }
 return url.toString();
}
function requestUrl(network:OAuthNetwork){
 return network==='meta'?callbackUri(process.env.META_REDIRECT_URI||''):
  network==='instagram'?callbackUri(process.env.INSTAGRAM_REDIRECT_URI||''):callbackUri(process.env.X_REDIRECT_URI||'');
}
export function hasOAuthConfig(network:OAuthNetwork){
 if(network==='meta')return Boolean(process.env.META_APP_ID&&process.env.META_APP_SECRET&&process.env.META_REDIRECT_URI);
 if(network==='instagram')return Boolean(process.env.INSTAGRAM_APP_ID&&process.env.INSTAGRAM_APP_SECRET&&process.env.INSTAGRAM_REDIRECT_URI);
 return Boolean(process.env.X_CLIENT_ID&&process.env.X_CLIENT_SECRET&&process.env.X_REDIRECT_URI);
}
export function authorizeUrl(network:OAuthNetwork,state:string,verifier?:string):string{
 if(network==='meta'){
  requireConfig('META_APP_ID','META_APP_SECRET','META_REDIRECT_URI');
  const params=new URLSearchParams({
   client_id:process.env.META_APP_ID!,redirect_uri:requestUrl('meta'),state,response_type:'code',
   scope:'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
  });
  return 'https://www.facebook.com/'+GRAPH_VERSION+'/dialog/oauth?'+params;
 }
 if(network==='instagram'){
  requireConfig('INSTAGRAM_APP_ID','INSTAGRAM_APP_SECRET','INSTAGRAM_REDIRECT_URI');
  // Request basic access by default. Add scopes only after Meta grants them.
  const allowed=['instagram_business_basic','instagram_business_content_publish',
   'instagram_business_manage_comments','instagram_business_manage_messages','instagram_business_manage_insights'];
  const configured=(process.env.INSTAGRAM_SCOPES||'instagram_business_basic').split(',').map(x=>x.trim());
  if(configured.some(x=>!allowed.includes(x))||!configured.includes('instagram_business_basic'))
   throw new Error('Invalid INSTAGRAM_SCOPES');
  const params=new URLSearchParams({client_id:process.env.INSTAGRAM_APP_ID!,
   redirect_uri:requestUrl('instagram'),response_type:'code',state,
   scope:[...new Set(configured)].join(',')});
  return 'https://www.instagram.com/oauth/authorize?'+params;
 }
 requireConfig('X_CLIENT_ID','X_CLIENT_SECRET','X_REDIRECT_URI');
 if(!verifier)throw new Error('PKCE verifier required');
 const params=new URLSearchParams({
  response_type:'code',client_id:process.env.X_CLIENT_ID!,redirect_uri:requestUrl('x'),
  state,scope:'tweet.read tweet.write users.read offline.access',
  code_challenge:challenge(verifier),code_challenge_method:'S256',
 });
 return 'https://x.com/i/oauth2/authorize?'+params;
}
async function json<T>(url:string,opts:RequestInit):Promise<T>{
 let response:Response;
 try{response=await fetch(url,{...opts,signal:AbortSignal.timeout(12000),redirect:'error'});}
 catch{throw new BadGatewayException('Upstream provider unreachable');}
 if(!response.ok)throw new BadGatewayException('Provider returned an unsuccessful response');
 try{return await response.json() as T;}catch{throw new BadGatewayException('Invalid provider response');}
}
type MetaToken={access_token:string;expires_in?:number};
type MetaPage={id:string;name?:string;access_token?:string;instagram_business_account?:{id:string;username?:string}};
export async function exchangeCode(network:OAuthNetwork,code:string,verifier?:string):Promise<AccountResponse>{
 if(network==='meta'){
  requireConfig('META_APP_ID','META_APP_SECRET','META_REDIRECT_URI');
  const params=new URLSearchParams({
    client_id:process.env.META_APP_ID!,client_secret:process.env.META_APP_SECRET!,
    redirect_uri:requestUrl('meta'),code,
  });
  const short=await json<MetaToken>('https://graph.facebook.com/'+GRAPH_VERSION+'/oauth/access_token?'+params,{method:'GET'});
  if(typeof short.access_token!=='string'||short.access_token.length<10)throw new BadGatewayException('Meta token missing');
  const longParams=new URLSearchParams({
    grant_type:'fb_exchange_token',client_id:process.env.META_APP_ID!,client_secret:process.env.META_APP_SECRET!,
    fb_exchange_token:short.access_token,
  });
  const long=await json<MetaToken>('https://graph.facebook.com/'+GRAPH_VERSION+'/oauth/access_token?'+longParams,{method:'GET'});
  if(typeof long.access_token!=='string'||long.access_token.length<10)throw new BadGatewayException('Meta long-lived token missing');
  const pages=await json<{data?:MetaPage[]}>('https://graph.facebook.com/'+GRAPH_VERSION+'/me/accounts?'+new URLSearchParams({
   fields:'id,name,access_token,instagram_business_account{id,username}',limit:'100',
  }),{method:'GET',headers:{Authorization:'Bearer '+long.access_token}});
  const expiresAt=long.expires_in?new Date(Date.now()+long.expires_in*1000).toISOString():undefined;
  // Requested OAuth permissions are not proof of grants; inspect Meta's actual grant result.
  const permissions=await json<{data?:Array<{permission:string;status:string}>}>(
    'https://graph.facebook.com/'+GRAPH_VERSION+'/me/permissions?limit=100',
    {method:'GET',headers:{Authorization:'Bearer '+long.access_token}});
  const granted=(permissions.data||[]).filter(x=>x.status==='granted').map(x=>x.permission);
  const accounts:PendingAccount[]=[];
  for(const page of pages.data||[]){
   if(typeof page.id!=='string'||typeof page.access_token!=='string'||!page.access_token)continue;
   // The requested OAuth scopes are not proof of granted permissions; verify them before publishing.
   accounts.push({platform:'facebook',id:page.id,name:page.name||'Facebook Page',accessToken:page.access_token,userAccessToken:long.access_token,scopes:granted,expiresAt});
   if(page.instagram_business_account?.id){
    accounts.push({platform:'instagram',id:page.instagram_business_account.id,
     name:page.instagram_business_account.username||'Instagram professional account',
     accessToken:page.access_token,userAccessToken:long.access_token,scopes:granted,expiresAt});
   }
  }
  if(!accounts.length)throw new BadGatewayException('No eligible Facebook Pages found');
  return {accounts};
 }
 if(network==='instagram'){
  requireConfig('INSTAGRAM_APP_ID','INSTAGRAM_APP_SECRET','INSTAGRAM_REDIRECT_URI');
  const form=new URLSearchParams({client_id:process.env.INSTAGRAM_APP_ID!,
   client_secret:process.env.INSTAGRAM_APP_SECRET!,grant_type:'authorization_code',
   redirect_uri:requestUrl('instagram'),code});
  // Unlike Facebook Login, Instagram Business Login exchanges its code on api.instagram.com.
  type IgShort={access_token?:string;user_id?:string|number;permissions?:string[]};
  const response=await json<IgShort|{data?:IgShort[]}>(
   'https://api.instagram.com/oauth/access_token',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const short='data' in response?
   (Array.isArray(response.data)&&response.data.length===1?response.data[0]:{} as IgShort):response;
  if(typeof short.access_token!=='string'||short.access_token.length<10)
   throw new BadGatewayException('Instagram authorization response invalid');
  const exchange=new URLSearchParams({grant_type:'ig_exchange_token',
   client_secret:process.env.INSTAGRAM_APP_SECRET!,access_token:short.access_token});
  const long=await json<{access_token?:string;expires_in?:number}>(
   'https://graph.instagram.com/access_token?'+exchange,{method:'GET'});
  if(typeof long.access_token!=='string'||long.access_token.length<10)
   throw new BadGatewayException('Instagram long-lived token missing');
  const identity=await json<{id?:string;user_id?:string;username?:string;account_type?:string}>(
   'https://graph.instagram.com/me?fields=id,username,account_type',{
    method:'GET',headers:{Authorization:'Bearer '+long.access_token}});
  if(!identity.id||typeof identity.id!=='string'||
   !['BUSINESS','MEDIA_CREATOR','CREATOR'].includes(identity.account_type||''))
   throw new BadGatewayException('Eligible Instagram professional account not returned');
  if(short.user_id&&String(short.user_id)!==identity.id)
   throw new BadGatewayException('Instagram identity mismatch');
  // Requested scopes are not proof of granted scopes. Only record explicit grants when returned.
  const requested=(process.env.INSTAGRAM_SCOPES||'instagram_business_basic').split(',').map(x=>x.trim());
  const scopes=Array.isArray(short.permissions)?
   short.permissions.filter(x=>typeof x==='string'&&requested.includes(x)):[];
  return {accounts:[{platform:'instagram',id:identity.id,name:identity.username||'Instagram professional account',
   accessToken:long.access_token,loginType:'instagram',scopes,
   expiresAt:long.expires_in?new Date(Date.now()+long.expires_in*1000).toISOString():undefined}]};
 }
 requireConfig('X_CLIENT_ID','X_CLIENT_SECRET','X_REDIRECT_URI');
 if(!verifier)throw new Error('Missing X PKCE verifier');
 const form=new URLSearchParams({
  grant_type:'authorization_code',code,redirect_uri:requestUrl('x'),code_verifier:verifier,
 });
 const basic=Buffer.from(process.env.X_CLIENT_ID+':'+process.env.X_CLIENT_SECRET).toString('base64');
 const tokens=await json<{access_token?:string;refresh_token?:string;expires_in?:number;scope?:string}>(
  'https://api.x.com/2/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',
    Authorization:'Basic '+basic},body:form});
 if(!tokens.access_token)throw new BadGatewayException('X access token missing');
 const profile=await json<{data?:{id?:string;name?:string;username?:string}}>(
  'https://api.x.com/2/users/me',{method:'GET',headers:{Authorization:'Bearer '+tokens.access_token}});
 if(!profile.data?.id)throw new BadGatewayException('X account identity unavailable');
 return {accounts:[{
  platform:'x',id:profile.data.id,name:profile.data.username||profile.data.name||'X account',
  accessToken:tokens.access_token,refreshToken:tokens.refresh_token,
  expiresAt:tokens.expires_in?new Date(Date.now()+tokens.expires_in*1000).toISOString():undefined,
  scopes:tokens.scope?.split(' ')||['users.read'],
 }]};
}
