import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {inspectMetaAccount,refreshMetaAccount,metaScopeHealth,MetaAccessError}=require('../dist/social-oauth/meta-account.js');

test('permission gating is based on actual Meta grants, not the OAuth request',()=>{
 const fb=metaScopeHealth('facebook',['pages_manage_posts','pages_read_engagement']);
 assert.equal(fb.state,'CONNECTED');
 assert.equal(metaScopeHealth('instagram',['instagram_basic']).state,'LIMITED');
 assert.ok(metaScopeHealth('instagram',['instagram_basic']).missingScopes.includes('instagram_content_publish'));
 assert.equal(metaScopeHealth('facebook',[],false).state,'RESTRICTED');
});
test('checks exact identity and granted permission status using GET requests only',async()=>{
 const calls=[];
 const fake=async(url,options)=>{
  calls.push({url,method:options.method});
  if(url.includes('/me/permissions'))return Response.json({data:[
   {permission:'pages_manage_posts',status:'granted'},
   {permission:'pages_read_engagement',status:'declined'},
  ]});
  return Response.json({id:'page-123',name:'Test Page'});
 };
 const health=await inspectMetaAccount({
  platform:'facebook',externalAccountId:'page-123',
  credentials:{accessToken:'secret-page',userAccessToken:'secret-user'},expiresAt:null
 },fake);
 assert.equal(health.state,'LIMITED');
 assert.deepEqual(health.missingScopes,['pages_read_engagement']);
 assert.ok(calls.every(x=>x.method==='GET'&&x.url.startsWith('https://graph.facebook.com/')));
 assert.ok(calls.every(x=>!x.url.includes('secret-page')&&!x.url.includes('secret-user')));
 await assert.rejects(inspectMetaAccount({
  platform:'facebook',externalAccountId:'unrelated-page',
  credentials:{accessToken:'secret-page',userAccessToken:'secret-user'},expiresAt:null
 },fake),e=>e instanceof MetaAccessError&&e.kind==='restricted');
});
test('expired or missing parent token never reports a healthy connection',async()=>{
 const unused=async()=>{throw Error('network not expected');};
 const sample={platform:'instagram',externalAccountId:'ig-123',credentials:{accessToken:'page-token'},expiresAt:null};
 assert.equal((await inspectMetaAccount(sample,unused)).state,'RESTRICTED');
 assert.equal((await inspectMetaAccount({...sample,credentials:{accessToken:'p',userAccessToken:'u'},
  expiresAt:new Date(Date.now()-5000)},unused)).state,'RESTRICTED');
});
test('token refresh preserves exact Instagram identity and refuses account switching',async()=>{
 const old={META_APP_ID:process.env.META_APP_ID,META_APP_SECRET:process.env.META_APP_SECRET};
 process.env.META_APP_ID='test-app';process.env.META_APP_SECRET='test-secret';
 let changed=false;
 const fake=async(url,opts)=>{
  const u=new URL(url);
  if(u.pathname.endsWith('/oauth/access_token'))return Response.json({access_token:'long-token-renewed',expires_in:3600});
  if(u.pathname.endsWith('/me/accounts'))return Response.json({data:[{
   id:'page-11',access_token:'new-page-token',instagram_business_account:{id:changed?'ig-swapped':'ig-original'}
  }]});
  if(u.pathname.endsWith('/me/permissions'))return Response.json({data:[
   {permission:'instagram_basic',status:'granted'},
   {permission:'instagram_content_publish',status:'granted'}
  ]});
  return Response.json({id:'ig-original',username:'brand'});
 };
 try{
  const input={platform:'instagram',externalAccountId:'ig-original',
   credentials:{accessToken:'old-page',userAccessToken:'old-user'},expiresAt:null};
  const ok=await refreshMetaAccount(input,fake);
  assert.equal(ok.health.state,'CONNECTED');
  assert.equal(ok.credentials.accessToken,'new-page-token');
  assert.equal(ok.credentials.userAccessToken,'long-token-renewed');
  assert.ok(ok.expiresAt instanceof Date);
  changed=true;
  await assert.rejects(refreshMetaAccount(input,fake),e=>e instanceof MetaAccessError&&e.kind==='restricted');
 }finally{
  for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
