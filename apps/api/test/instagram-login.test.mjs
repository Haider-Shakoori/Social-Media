import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {createHmac} from 'node:crypto';
const require=createRequire(import.meta.url);
const {authorizeUrl,hasOAuthConfig,exchangeCode}=require('../dist/social-oauth/provider-transport.js');
const {signedInstagramUser,deletionReceipt,validDeletionReceipt}=require('../dist/social-oauth/instagram-callback-security.js');
const {inspectMetaAccount,refreshMetaAccount,MetaAccessError}=require('../dist/social-oauth/meta-account.js');

function signed(data,secret){
 const payload=Buffer.from(JSON.stringify(data)).toString('base64url');
 return createHmac('sha256',secret).update(payload).digest('base64url')+'.'+payload;
}
test('Instagram OAuth is separate from Facebook and requires exact HTTPS callback',()=>{
 const names=['INSTAGRAM_APP_ID','INSTAGRAM_APP_SECRET','INSTAGRAM_REDIRECT_URI','INSTAGRAM_SCOPES'];
 const before=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 try{
  Object.assign(process.env,{INSTAGRAM_APP_ID:'instagram-app-id',
   INSTAGRAM_APP_SECRET:'example-only',INSTAGRAM_REDIRECT_URI:
   'https://socials.businessos.af/api/v1/social/oauth/instagram/callback'});
  delete process.env.INSTAGRAM_SCOPES;
  assert.equal(hasOAuthConfig('instagram'),true);
  const auth=new URL(authorizeUrl('instagram','state-test'));
  assert.equal(auth.origin,'https://www.instagram.com');
  assert.equal(auth.pathname,'/oauth/authorize');
  assert.equal(auth.searchParams.get('redirect_uri'),process.env.INSTAGRAM_REDIRECT_URI);
  assert.equal(auth.searchParams.get('scope'),'instagram_business_basic');
  assert.equal(auth.searchParams.get('state'),'state-test');
  process.env.INSTAGRAM_SCOPES='instagram_business_basic,instagram_business_manage_comments';
  assert.equal(new URL(authorizeUrl('instagram','test')).searchParams.get('scope'),process.env.INSTAGRAM_SCOPES);
  process.env.INSTAGRAM_SCOPES='instagram_business_basic,pages_manage_posts';
  assert.throws(()=>authorizeUrl('instagram','state-test'),/Invalid INSTAGRAM_SCOPES/);
  process.env.INSTAGRAM_SCOPES='instagram_business_basic';
  process.env.INSTAGRAM_REDIRECT_URI='http://outside.invalid/callback';
  assert.throws(()=>authorizeUrl('instagram','state-test'),/HTTPS/);
 }finally{
  for(const [k,v] of Object.entries(before))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
test('Instagram exchanges code on official hosts and preserves exact professional identity',async()=>{
 const names=['INSTAGRAM_APP_ID','INSTAGRAM_APP_SECRET','INSTAGRAM_REDIRECT_URI'];
 const before=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 const previousFetch=globalThis.fetch;
 try{
  Object.assign(process.env,{INSTAGRAM_APP_ID:'ig-123',INSTAGRAM_APP_SECRET:'secret',
   INSTAGRAM_REDIRECT_URI:'https://socials.businessos.af/api/v1/social/oauth/instagram/callback'});
  const calls=[];
  globalThis.fetch=async(url,opts)=>{
   const u=new URL(url);calls.push({url:u,options:opts});
   if(u.hostname==='api.instagram.com'){
    assert.equal(opts.method,'POST');
    assert.equal(opts.body.get('grant_type'),'authorization_code');
    assert.equal(opts.body.get('redirect_uri'),process.env.INSTAGRAM_REDIRECT_URI);
    return Response.json({access_token:'short-lived-access-token',user_id:'1784140408606515',
     permissions:['instagram_business_basic']});
   }
   if(u.pathname==='/access_token')return Response.json({access_token:'long-lived-access-token',expires_in:5184000});
   if(u.pathname==='/me')return Response.json({id:'1784140408606515',username:'pilot_account',account_type:'BUSINESS'});
   return Response.json({}, {status:404});
  };
  const result=await exchangeCode('instagram','authorization-code');
  assert.equal(result.accounts.length,1);
  assert.equal(result.accounts[0].platform,'instagram');
  assert.equal(result.accounts[0].loginType,'instagram');
  assert.equal(result.accounts[0].id,'1784140408606515');
  assert.deepEqual(result.accounts[0].scopes,['instagram_business_basic']);
  assert.deepEqual(calls.map(x=>x.url.hostname),['api.instagram.com','graph.instagram.com','graph.instagram.com']);
  globalThis.fetch=async(url,opts)=>{
   const u=new URL(url);
   if(u.hostname==='api.instagram.com')return Response.json({access_token:'short-lived-access-token',user_id:'1784140408606515'});
   if(u.pathname==='/access_token')return Response.json({access_token:'long-lived-access-token',expires_in:5184000});
   return Response.json({id:'different-identity',username:'attacker',account_type:'BUSINESS'});
  };
  await assert.rejects(exchangeCode('instagram','code'),error=>error.stage==='instagram_identity_mismatch');
 }finally{
  globalThis.fetch=previousFetch;
  for(const [k,v] of Object.entries(before))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
test('signed callbacks verify Meta HMAC; receipts are signed and expire',()=>{
 const old=process.env.INSTAGRAM_APP_SECRET;process.env.INSTAGRAM_APP_SECRET='test-secret';
 try{
  const request=signed({algorithm:'HMAC-SHA256',user_id:'1784140408606515'},'test-secret');
  assert.equal(signedInstagramUser({signed_request:request}),'1784140408606515');
  assert.throws(()=>signedInstagramUser({signed_request:request.slice(0,-4)+'AAAA'}));
  assert.throws(()=>signedInstagramUser({signed_request:signed({user_id:'123456'},'wrong-secret')}));
  assert.throws(()=>signedInstagramUser({signed_request:signed({user_id:'nope'},'test-secret')}));
  const receipt=deletionReceipt();
  assert.equal(validDeletionReceipt(receipt),true);
  assert.equal(validDeletionReceipt(receipt.slice(0,-3)+'abc'),false);
  assert.equal(validDeletionReceipt('garbage'),false);
 }finally{if(old===undefined)delete process.env.INSTAGRAM_APP_SECRET;else process.env.INSTAGRAM_APP_SECRET=old;}
});
test('Instagram health uses graph.instagram.com, never Facebook Page APIs',async()=>{
 const calls=[];
 const fake=async(url,opts)=>{
  const u=new URL(url);calls.push(u);
  assert.equal(u.hostname,'graph.instagram.com');
  assert.equal(opts.method,'GET');
  if(u.pathname==='/me')return Response.json({id:'1784140408606515',username:'pilot',account_type:'BUSINESS'});
  if(u.pathname==='/refresh_access_token')return Response.json({access_token:'refreshed-long-lived-ig-token',expires_in:5184000});
  return Response.json({},{status:404});
 };
 const account={platform:'instagram',externalAccountId:'1784140408606515',
  credentials:{loginType:'instagram',accessToken:'long-lived-instagram'},expiresAt:null};
 const health=await inspectMetaAccount(account,fake);
 assert.equal(health.state,'LIMITED');
 assert.equal(health.reason,'permissions_unverified');
 const refreshed=await refreshMetaAccount(account,fake);
 assert.equal(refreshed.credentials.loginType,'instagram');
 assert.equal(refreshed.credentials.accessToken,'refreshed-long-lived-ig-token');
 assert.ok(refreshed.expiresAt instanceof Date);
 assert.ok(calls.every(x=>x.hostname==='graph.instagram.com'));
 await assert.rejects(inspectMetaAccount({...account,externalAccountId:'wrong-id'},fake),
  error=>error instanceof MetaAccessError&&error.kind==='restricted');
});
