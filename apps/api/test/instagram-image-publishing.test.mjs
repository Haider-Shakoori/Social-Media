import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {publishInstagramImage,instagramImageContainerStatus,verifyInstagramPublishedImage,
 assertPublishableInstagramImage}=require('../dist/publishing/instagram-image-publisher.js');
const {PublishOutcomeUnknown}=require('../dist/publishing/meta-publisher.js');
const {seal}=require('../dist/social-oauth/oauth-crypto.js');
const {sendMetaPost}=require('../dist/publishing/meta-publisher.js');
const input={accountId:'17841234567890123',accessToken:'long-lived-token-test',caption:'Hello Instagram!',
 imageUrl:'https://media.example.org/tenant/image.jpg'};
test('Instagram Login image flow uses graph.instagram.com only and checks FINISHED before publishing',async()=>{
 const calls=[];
 const fetcher=async (url,opts)=>{
  const uri=new URL(url);
  calls.push({uri,opts});
  assert.equal(uri.hostname,'graph.instagram.com');
  assert.equal(opts.headers.Authorization,'Bearer long-lived-token-test');
  assert.ok(!uri.href.includes('long-lived-token-test'));
  if(uri.pathname.endsWith('/media'))return Response.json({id:'container-101'});
  if(uri.pathname.endsWith('/container-101')){
   assert.equal(uri.searchParams.get('fields'),'id,status_code');
   return Response.json({id:'container-101',status_code:'FINISHED'});
  }
  if(uri.pathname.endsWith('/media_publish')){
   assert.equal(opts.body.get('creation_id'),'container-101');
   return Response.json({id:'media-515'});
  }
  throw Error('unexpected request');
 };
 assert.equal(await publishInstagramImage(input,fetcher,async()=>{}),'media-515');
 assert.deepEqual(calls.map(c=>c.opts.method),['POST','GET','POST']);
 assert.equal(calls[0].opts.body.get('image_url'),input.imageUrl);
 assert.equal(calls[0].opts.body.get('caption'),input.caption);
});
test('Instagram never publishes a container in ERROR or not yet ready',async()=>{
 let count=0,posted=0;
 const fail=async u=>{
  count++;
  const uri=new URL(u);
  if(uri.pathname.endsWith('/media'))return Response.json({id:'container-909'});
  if(uri.pathname.endsWith('/media_publish')){posted++;throw Error('publish unexpectedly called');}
  return Response.json({id:'container-909',status_code:'ERROR'});
 };
 await assert.rejects(publishInstagramImage(input,fail,async()=>{}),
  e=>e instanceof PublishOutcomeUnknown&&e.reason==='instagram_container_error');
 assert.equal(posted,0);
 const pending=async u=>{
  const uri=new URL(u);
  if(uri.pathname.endsWith('/media'))return Response.json({id:'container-909'});
  if(uri.pathname.endsWith('/media_publish'))throw Error('must not publish unfinished');
  return Response.json({id:'container-909',status_code:'IN_PROGRESS'});
 };
 await assert.rejects(publishInstagramImage(input,pending,async()=>{}),
  e=>e instanceof PublishOutcomeUnknown&&e.reason==='instagram_container_not_ready');
});
test('Instagram media URL and token validation block unsafe publishing',async()=>{
 for(const url of ['http://media.example.org/photo.jpg','https://127.0.0.1/photo.jpg',
  'https://10.2.2.3/photo.jpg','https://localhost/photo.jpg','https://media.local/photo.jpg',
  'https://user:secret@media.example.org/photo.jpg','file:///tmp/a.jpg','https://[::1]/p.jpg']){
  assert.throws(()=>assertPublishableInstagramImage(url),PublishOutcomeUnknown,url);
 }
 const forbidden=async()=>{throw Error('unexpected request');};
 await assert.rejects(publishInstagramImage({...input,imageUrl:'https://169.254.169.254/a.jpg'},forbidden),
  PublishOutcomeUnknown);
 await assert.rejects(publishInstagramImage({...input,caption:'x'.repeat(2201)},forbidden),
  PublishOutcomeUnknown);
});
test('Only an explicit publish flag routes official Instagram Login to its own graph host',async()=>{
 const oldKey=process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
 const oldFlag=process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED;
 process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');
 const vault=seal({loginType:'instagram',accessToken:'long-lived-token-test'});
 try{
  let calls=0;const fetcher=async url=>{
   calls++;
   const uri=new URL(url);
   assert.equal(uri.hostname,'graph.instagram.com');
   if(uri.pathname.endsWith('/media'))return Response.json({id:'container-101'});
   if(uri.pathname.endsWith('/container-101'))return Response.json({id:'container-101',status_code:'FINISHED'});
   return Response.json({id:'media-515'});
  };
  delete process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED;
  await assert.rejects(sendMetaPost({platform:'instagram',accountId:input.accountId,
   encryptedCredentials:vault,caption:input.caption,mediaUrls:[input.imageUrl]},fetcher),
   e=>e instanceof PublishOutcomeUnknown&&e.reason==='instagram_login_publishing_not_enabled');
  assert.equal(calls,0);
  process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED='true';
  assert.equal(await sendMetaPost({platform:'instagram',accountId:input.accountId,
   encryptedCredentials:vault,caption:input.caption,mediaUrls:[input.imageUrl]},fetcher),'media-515');
  assert.equal(calls,3);
 }finally{
  if(oldKey===undefined)delete process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  else process.env.SOCIAL_TOKEN_ENCRYPTION_KEY=oldKey;
  if(oldFlag===undefined)delete process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED;
  else process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED=oldFlag;
 }
});
test('Remote-image verification never publishes and checks exact id and permalink',async()=>{
 const ok=async(_url,options)=>{
  assert.equal(options.method,'GET');
  return Response.json({id:'media-515',media_type:'IMAGE',
   permalink:'https://www.instagram.com/p/example/'});
 };
 assert.equal(await verifyInstagramPublishedImage('media-515',input.accessToken,ok),true);
 assert.equal(await verifyInstagramPublishedImage('media-515',input.accessToken,
  async()=>Response.json({id:'other',media_type:'IMAGE',permalink:'https://www.instagram.com/p/a/'})),false);
 assert.equal(await verifyInstagramPublishedImage('../bad',input.accessToken,ok),false);
});
