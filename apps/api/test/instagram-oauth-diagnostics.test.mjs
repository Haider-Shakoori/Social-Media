import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {exchangeCode,InstagramOAuthFailure}=require('../dist/social-oauth/provider-transport.js');

const valid={
 INSTAGRAM_APP_ID:'1234567890123456',
 INSTAGRAM_APP_SECRET:'fixture-not-a-real-secret',
 INSTAGRAM_REDIRECT_URI:'https://example.test/api/v1/social/oauth/instagram/callback',
 INSTAGRAM_SCOPES:'instagram_business_basic',
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
async function assertStage(stage,responses){
 let index=0;
 const previous=globalThis.fetch;
 globalThis.fetch=async (_url,opts)=>{
  assert.equal(opts.redirect,'error');
  return responses[index++]||json({error:{message:'Sensitive fixture token fixture-secret'}},400);
 };
 try{
  await assert.rejects(exchangeCode('instagram','fixture-authorization-code'),error=>{
   assert.ok(error instanceof InstagramOAuthFailure);
   assert.equal(error.stage,stage);
   assert.ok(!error.message.includes('fixture-authorization-code'));
   assert.ok(!error.message.includes('fixture-not-a-real-secret'));
   assert.ok(!error.message.includes('Sensitive'));
   return true;
  });
 }finally{globalThis.fetch=previous;}
}
test('Instagram token-exchange failures receive fixed, non-sensitive stages',async()=>{
 const previous=Object.fromEntries(Object.keys(valid).map(k=>[k,process.env[k]]));
 Object.assign(process.env,valid);
 try{
  const short={access_token:'fixture-short-access-token',user_id:'1234',permissions:['instagram_business_basic']};
  const long={access_token:'fixture-long-access-token',expires_in:5000};
  await assertStage('instagram_short_exchange',[json({error:{message:'fixture secret'}},400)]);
  await assertStage('instagram_short_response',[json({access_token:null},200)]);
  await assertStage('instagram_long_exchange',[json(short),json({error:{message:'fixture secret'}},400)]);
  await assertStage('instagram_long_response',[json(short),json({expires_in:5000})]);
  await assertStage('instagram_profile_lookup',[json(short),json(long),json({},403)]);
  await assertStage('instagram_account_ineligible',[json(short),json(long),json({id:'1234',username:'test',account_type:'PERSONAL'})]);
  await assertStage('instagram_identity_mismatch',[json(short),json(long),json({id:'app-scoped-id',user_id:'9999',username:'test',account_type:'BUSINESS'})]);
  await assertStage('instagram_identity_mismatch',[json(short),json(long),json({id:'app-scoped-id',username:'test',account_type:'BUSINESS'})]);
 }finally{
  for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
test('Instagram exchange supports a valid professional account response',async()=>{
 const previous=Object.fromEntries(Object.keys(valid).map(k=>[k,process.env[k]]));
 Object.assign(process.env,valid);
 let n=0;const previousFetch=globalThis.fetch;
 const responses=[
  json({data:[{access_token:'fixture-short-access-token',user_id:'1234',permissions:['instagram_business_basic']}]}),
  json({access_token:'fixture-long-access-token',expires_in:5000}),
  json({id:'app-scoped-user-1234',user_id:'1234',username:'fixture_ig',account_type:'BUSINESS'}),
 ];
 globalThis.fetch=async()=>responses[n++];
 try{
  const result=await exchangeCode('instagram','fixture-code');
  assert.equal(result.accounts.length,1);
  assert.equal(result.accounts[0].platform,'instagram');
  assert.equal(result.accounts[0].id,'app-scoped-user-1234');
  assert.equal(result.accounts[0].loginType,'instagram');
  assert.deepEqual(result.accounts[0].scopes,['instagram_business_basic']);
 }finally{
  globalThis.fetch=previousFetch;
  for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});

test('Preserves exact large numeric OAuth user_id and compares to /me.user_id, not /me.id',async()=>{
 const previous=Object.fromEntries(Object.keys(valid).map(k=>[k,process.env[k]]));
 Object.assign(process.env,valid);
 let count=0;const previousFetch=globalThis.fetch;
 // This integer is larger than Number.MAX_SAFE_INTEGER. Tests use raw
 // JSON text to avoid rounding in the test fixture itself.
 const responses=[
  new Response('{"access_token":"short-lived-test-token","user_id":17841404086065153}',{headers:{'Content-Type':'application/json'}}),
  json({access_token:'long-lived-test-token',expires_in:5000}),
  new Response('{"id":"app-scoped-ig-917","user_id":17841404086065153,"username":"fixture_business","account_type":"BUSINESS"}',{headers:{'Content-Type':'application/json'}}),
 ];
 globalThis.fetch=async()=>responses[count++];
 try{
  const result=await exchangeCode('instagram','fixture-code');
  assert.equal(result.accounts[0].id,'app-scoped-ig-917');
  assert.equal(result.accounts[0].name,'fixture_business');
  assert.equal(count,3);
 }finally{
  globalThis.fetch=previousFetch;
  for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
test('Rejects different exact large numeric IG professional IDs despite same app-scoped id',async()=>{
 const previous=Object.fromEntries(Object.keys(valid).map(k=>[k,process.env[k]]));
 Object.assign(process.env,valid);
 let count=0;const previousFetch=globalThis.fetch;
 const responses=[
  new Response('{"access_token":"short-lived-test-token","user_id":17841404086065153}'),
  json({access_token:'long-lived-test-token',expires_in:5000}),
  new Response('{"id":"app-scoped-ig-917","user_id":17841404086065154,"username":"fixture_business","account_type":"BUSINESS"}'),
 ];
 globalThis.fetch=async()=>responses[count++];
 try{
  await assert.rejects(exchangeCode('instagram','fixture-code'),error=>{
   assert.ok(error instanceof InstagramOAuthFailure);
   assert.equal(error.stage,'instagram_identity_mismatch');
   return true;
  });
 }finally{
  globalThis.fetch=previousFetch;
  for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
