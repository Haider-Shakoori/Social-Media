import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {seal}=require('../dist/social-oauth/oauth-crypto.js');
const {sendInstagramImage,verifyInstagramMedia,InstagramPublishUncertain}=require('../dist/publishing/instagram-image-publisher.js');
const withSecrets=async callback=>{
 const old=Object.fromEntries(['SOCIAL_TOKEN_ENCRYPTION_KEY','INSTAGRAM_IMAGE_PUBLISHING_ENABLED','INSTAGRAM_MEDIA_ALLOWED_HOSTS']
   .map(k=>[k,process.env[k]]));
 Object.assign(process.env,{SOCIAL_TOKEN_ENCRYPTION_KEY:Buffer.alloc(32,6).toString('base64'),
  INSTAGRAM_IMAGE_PUBLISHING_ENABLED:'true',INSTAGRAM_MEDIA_ALLOWED_HOSTS:'media.example.test'});
 try{await callback();}finally{
  for(const [k,v]of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
};
const sample=(secret)=>({accountId:'ig-12345',encryptedCredentials:secret,caption:'Approved post',
 imageUrl:'https://media.example.test/photos/approved.jpeg',
 grantedScopes:['instagram_business_basic','instagram_business_content_publish']});
test('Instagram Login image publisher creates, polls, publishes and verifies with token on official Graph only',async()=>{
 await withSecrets(async()=>{
  const vault=seal({loginType:'instagram',accessToken:'secret-ig-token'});
  const calls=[];let status=0;
  const fake=async (url,options)=>{
   const uri=new URL(url);calls.push({uri,options});
   assert.equal(uri.origin,'https://graph.instagram.com');
   assert.equal(options.headers.Authorization,'Bearer secret-ig-token');
   assert.ok(!url.includes('secret-ig-token'));
   if(uri.pathname.endsWith('/media'))return Response.json({id:'container-123'});
   if(uri.pathname.endsWith('/container-123')){
    return Response.json({id:'container-123',status_code:status++===0?'IN_PROGRESS':'FINISHED'});
   }
   if(uri.pathname.endsWith('/media_publish'))return Response.json({id:'media-789'});
   if(uri.pathname.endsWith('/media-789'))return Response.json({id:'media-789',permalink:'https://instagram.com/p/sample'});
   return Response.json({error:'unknown'}, {status:404});
  };
  const waits=[];
  const result=await sendInstagramImage(sample(vault),fake,async(ms)=>{waits.push(ms)});
  assert.deepEqual(result,{mediaId:'media-789',containerId:'container-123'});
  assert.deepEqual(calls.slice(0,4).map(x=>x.options.method),['POST','GET','GET','POST']);
  assert.deepEqual(waits,[3000]);
  assert.equal(await verifyInstagramMedia({remoteId:'media-789',encryptedCredentials:vault},fake),true);
  assert.equal(calls.at(-1).options.method,'GET');
 });
});
test('Approval and provider access are not granted by a token alone',async()=>{
 await withSecrets(async()=>{
  const vault=seal({loginType:'instagram',accessToken:'secret-ig-token'});
  let calls=0;
  const fake=async()=>{calls++;return Response.json({id:'x'})};
  const input=sample(vault);
  for(const patch of [
   {grantedScopes:['instagram_business_basic']},
   {imageUrl:'http://media.example.test/image.jpeg'},
   {imageUrl:'https://127.0.0.1/test.jpeg'},
   {imageUrl:'https://untrusted.example.test/test.jpeg'},
   {imageUrl:'https://media.example.test/test.png'},
   {accountId:'../bad'},
  ]){
   await assert.rejects(sendInstagramImage({...input,...patch},fake),e=>e instanceof InstagramPublishUncertain);
  }
  process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED='false';
  await assert.rejects(sendInstagramImage(input,fake),e=>e.reason==='image_publishing_disabled');
  assert.equal(calls,0,'Never contact provider when gates are incomplete');
 });
});
test('Failed or unfinished container status cannot trigger a publish POST',async()=>{
 await withSecrets(async()=>{
  const vault=seal({loginType:'instagram',accessToken:'secret-ig-token'});
  let writes=0;
  const fake=async (url,opts)=>{
   if(opts.method==='POST'){
    writes++;
    return Response.json({id:'container-123'});
   }
   return Response.json({status_code:'IN_PROGRESS'});
  };
  await assert.rejects(sendInstagramImage(sample(vault),fake,async()=>{}),
   e=>e.reason==='container_not_ready');
  assert.equal(writes,1);
 });
});
test('Ambiguous provider errors do not trigger automatic write retries',async()=>{
 await withSecrets(async()=>{
  const vault=seal({loginType:'instagram',accessToken:'secret-ig-token'});
  let calls=0;
  await assert.rejects(sendInstagramImage(sample(vault),async()=>{calls++;throw Error('network timeout');}),
   e=>e.reason==='provider_network_or_timeout');
  assert.equal(calls,1);
  assert.equal(await verifyInstagramMedia({remoteId:'../../host',encryptedCredentials:vault},async()=>{throw Error('no network')}),false);
 });
});
