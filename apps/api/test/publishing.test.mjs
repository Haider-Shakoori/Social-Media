import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {metaPublishingBlockers,supportedMetaFormat}=require('../dist/publishing/guard.js');
const {sendMetaPost,PublishOutcomeUnknown}=require('../dist/publishing/meta-publisher.js');
const {verifyFacebookRemote}=require('../dist/publishing/reconcile.js');
const {seal}=require('../dist/social-oauth/oauth-crypto.js');
const scopeFb=['pages_manage_posts','pages_read_engagement'];
const healthy={
 network:'facebook',featureEnabled:true,globalPaused:false,brandPaused:false,archived:false,
 mode:'OFFICIAL',connectionState:'CONNECTED',connectionPaused:false,tokenExpiresAt:new Date(Date.now()+86400000),
 scopes:scopeFb,policyState:'PRODUCTION_READY',operatorEnabled:true,apiApproved:true,
 productionVerified:true,subscriptionActive:true,approvedVersionMatches:true,approvalGranted:true,
 approvedByAnotherUser:true,contentSupported:true,
};
test('Meta eligibility requires every independent gate and always excludes X',()=>{
 assert.deepEqual(metaPublishingBlockers(healthy),[]);
 for(const patch of [
  {featureEnabled:false},{globalPaused:true},{brandPaused:true},{archived:true},
  {mode:'EXPERIMENTAL'},{connectionState:'LIMITED'},{connectionPaused:true},
  {tokenExpiresAt:new Date(Date.now()-2000)},{scopes:[]},
  {policyState:'TESTING'},{operatorEnabled:false},{apiApproved:false},
  {productionVerified:false},{subscriptionActive:false},{approvedVersionMatches:false},
  {approvalGranted:false},{approvedByAnotherUser:false},{contentSupported:false},
  {network:'x'},{network:'youtube'},
 ])assert.ok(metaPublishingBlockers({...healthy,...patch}).length,JSON.stringify(patch));
 assert.ok(metaPublishingBlockers({...healthy,network:'instagram',scopes:['instagram_basic']}).includes('permission_missing'));
 const direct={...healthy,network:'instagram',loginType:'instagram',
  scopes:['instagram_business_basic','instagram_business_content_publish']};
 assert.deepEqual(metaPublishingBlockers(direct),[]);
 assert.ok(metaPublishingBlockers({...direct,scopes:['instagram_business_basic']}).includes('permission_missing'));
 assert.ok(metaPublishingBlockers({...direct,scopes:['instagram_basic','instagram_content_publish']}).includes('permission_missing'));
 assert.equal(supportedMetaFormat('facebook',[]),true);
 assert.equal(supportedMetaFormat('facebook',['https://example.com/a.png']),false);
 assert.equal(supportedMetaFormat('instagram',['https://example.com/a.png']),true);
 assert.equal(supportedMetaFormat('instagram',['http://127.0.0.1/x']),false);
});
test('Meta publisher uses authorized Graph POST and never exposes credentials in URLs',async()=>{
 const old=process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
 process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,8).toString('base64');
 try{
  const vault=seal({accessToken:'test-secret-meta-token',userAccessToken:'user-secret'});
  const calls=[];
  const fake=async(u,options)=>{
   calls.push({url:u,options});
   return Response.json({id:calls.length===1?'creation-10':'remote-20'});
  };
  const fb=await sendMetaPost({platform:'facebook',accountId:'page-1',
   encryptedCredentials:vault,caption:'Hello',mediaUrls:[]},fake);
  assert.equal(fb,'creation-10');
  assert.equal(calls[0].options.method,'POST');
  assert.ok(calls[0].url.includes('/page-1/feed'));
  assert.ok(calls[0].options.headers.Authorization.includes('test-secret-meta-token'));
  assert.equal(calls[0].url.includes('test-secret-meta-token'),false);
  const ig=await sendMetaPost({platform:'instagram',accountId:'ig-1',
   encryptedCredentials:vault,caption:'Image',mediaUrls:['https://example.com/image.jpg']},fake);
  assert.equal(ig,'remote-20');
  assert.equal(calls[1].url.includes('/ig-1/media'),true);
  assert.equal(calls[2].url.includes('/ig-1/media_publish'),true);
  const igDirect=seal({loginType:'instagram',accessToken:'direct-ig-token'});
  await assert.rejects(sendMetaPost({platform:'instagram',accountId:'ig-direct',
   encryptedCredentials:igDirect,caption:'Test',mediaUrls:['https://example.com/image.jpg']},fake),
   e=>e instanceof PublishOutcomeUnknown&&e.reason==='instagram_login_publishing_not_enabled');
  assert.equal(calls.length,3,'Instagram Login token never sent to Facebook Graph');
  await assert.rejects(sendMetaPost({platform:'facebook',accountId:'page-1',
   encryptedCredentials:vault,caption:'Hello',mediaUrls:[]},async()=>{throw Error('timeout');}),
   e=>e instanceof PublishOutcomeUnknown);
 }finally{
  if(old===undefined)delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=old;
 }
});
test('Facebook reconciliation requires exact post ID and owning Page ID',async()=>{
 const old=process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
 process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,8).toString('base64');
 try{
  const encryptedCredentials=seal({accessToken:'test-secret'});
  const ctx={remoteId:'page1_123',pageId:'page1',encryptedCredentials};
  const found=async()=>Response.json({id:'page1_123',from:{id:'page1'}});
  assert.equal(await verifyFacebookRemote(ctx,found),true);
  assert.equal(await verifyFacebookRemote({...ctx,pageId:'other-page'},found),false);
  assert.equal(await verifyFacebookRemote({...ctx,remoteId:'../evil'},found),false);
  assert.equal(await verifyFacebookRemote(ctx,async()=>{throw Error('network');}),false);
 }finally{
  if(old===undefined)delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=old;
 }
});
