import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {makeUploadKey,issueUploadClaim,verifyUploadClaim,validateImageInput,
 validImageHeader,publicMediaUrl,requireR2Config,MAX_IMAGE_BYTES}=
 require('../dist/studio/media-storage.js');
const brand='12345678-1234-1234-1234-1234567890ab';
test('Image upload validates size, extension and safe binary magic',()=>{
 assert.equal(validateImageInput('image/jpeg',1024,'nice-photo.jpeg'),'image/jpeg');
 assert.equal(validateImageInput('image/png',1024,'image.PNG'),'image/png');
 for(const [type,size,file] of [
  ['image/svg+xml',1024,'x.svg'],['image/png',MAX_IMAGE_BYTES+1,'a.png'],
  ['image/jpeg',1024,'x.html'],['image/png',1024,'a.jpg'],
  ['image/jpeg',0,'a.jpg'],['image/png',1024,'../bad.png'],
 ])assert.throws(()=>validateImageInput(type,size,file));
 assert.ok(validImageHeader('image/png',Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3])));
 assert.ok(!validImageHeader('image/png',Uint8Array.from([60,104,116,109,108])));
 assert.ok(validImageHeader('image/jpeg',Uint8Array.from([255,216,255,1,2])));
 assert.ok(!validImageHeader('image/jpeg',Uint8Array.from([60,115,118,103])));
});
test('Media upload intent is signed, tenant-scoped, time-limited and non-replayable across brands',()=>{
 const before=process.env.MEDIA_UPLOAD_SIGNING_KEY;
 process.env.MEDIA_UPLOAD_SIGNING_KEY=Buffer.alloc(32,11).toString('base64');
 try{
  const key=makeUploadKey(brand,'image/jpeg');
  const claim={brandId:brand,key,mime:'image/jpeg',size:98765,expires:Date.now()+600000};
  const token=issueUploadClaim(claim);
  assert.deepEqual(verifyUploadClaim(token,brand),claim);
  assert.throws(()=>verifyUploadClaim(token,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'));
  assert.throws(()=>verifyUploadClaim(token.slice(0,-1)+'A',brand));
  assert.throws(()=>issueUploadClaim({...claim,key:'media/../../etc/passwd'}));
  assert.throws(()=>verifyUploadClaim(issueUploadClaim({...claim,expires:Date.now()-10}),brand));
  assert.throws(()=>verifyUploadClaim(issueUploadClaim({...claim,expires:Date.now()+25*60*1000}),brand));
  assert.equal(publicMediaUrl('https://cdn.example.org/',key),'https://cdn.example.org/'+key);
  assert.throws(()=>publicMediaUrl('http://cdn.example.org/',key));
  assert.throws(()=>publicMediaUrl('https://127.0.0.1/',key));
  assert.throws(()=>publicMediaUrl('https://user:pass@cdn.example.org/',key));
 }finally{if(before===undefined)delete process.env.MEDIA_UPLOAD_SIGNING_KEY;
  else process.env.MEDIA_UPLOAD_SIGNING_KEY=before;}
});
test('R2 remains disabled unless explicit opt-in and all private settings are present',()=>{
 const keys=['MEDIA_UPLOADS_ENABLED','MEDIA_UPLOAD_SIGNING_KEY','MEDIA_R2_ENDPOINT',
  'MEDIA_R2_BUCKET','MEDIA_R2_ACCESS_KEY_ID','MEDIA_R2_SECRET_ACCESS_KEY','MEDIA_PUBLIC_BASE_URL'];
 const old=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
 try{
  for(const k of keys)delete process.env[k];
  assert.throws(()=>requireR2Config());
  Object.assign(process.env,{
   MEDIA_UPLOADS_ENABLED:'true',MEDIA_UPLOAD_SIGNING_KEY:Buffer.alloc(32,2).toString('base64'),
   MEDIA_R2_ENDPOINT:'https://0123456789abcdef.r2.cloudflarestorage.com',
   MEDIA_R2_BUCKET:'private-bucket',MEDIA_R2_ACCESS_KEY_ID:'test-only',
   MEDIA_R2_SECRET_ACCESS_KEY:'test-only',MEDIA_PUBLIC_BASE_URL:'https://cdn.example.org/',
  });
  const c=requireR2Config();
  assert.equal(c.bucket,'private-bucket');
  process.env.MEDIA_R2_ENDPOINT='https://169.254.169.254';
  assert.throws(()=>requireR2Config());
 }finally{
  for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;
 }
});
