import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {ApprovalService}=require('../dist/approvals/approval.service.js');
test('Email approval and rejection links are only read-only navigation, never credentials or state changes',()=>{
 const previous=process.env.WEB_BASE_URL;
 process.env.WEB_BASE_URL='https://socials.businessos.af';
 try{
  const instance=new ApprovalService({},{},{});
  const tenant='11111111-1111-4111-8111-111111111111';
  const workspace='22222222-2222-4222-8222-222222222222';
  const brand='33333333-3333-4333-8333-333333333333';
  const request='44444444-4444-4444-8444-444444444444';
  for(const action of ['APPROVED','REJECTED']){
   const url=new URL(instance.approvalLink(tenant,workspace,brand,request,action));
   assert.equal(url.origin,'https://socials.businessos.af');
   assert.equal(url.pathname,'/review');
   assert.equal(url.searchParams.get('decision'),action);
   assert.equal(url.searchParams.get('request'),request);
   assert.equal(url.searchParams.get('brand'),brand);
   assert.equal(url.searchParams.has('token'),false);
   assert.equal(url.searchParams.has('access_token'),false);
  }
 }finally{
  if(previous===undefined)delete process.env.WEB_BASE_URL;
  else process.env.WEB_BASE_URL=previous;
 }
});
test('Reject insecure external callback host',()=>{
 const old=process.env.WEB_BASE_URL;
 process.env.WEB_BASE_URL='http://evil.example.test';
 try{
  const svc=new ApprovalService({},{},{});
  assert.throws(()=>svc.approvalLink('x','w','b','id','APPROVED'),/must be HTTPS/);
 }finally{
  if(old===undefined)delete process.env.WEB_BASE_URL;
  else process.env.WEB_BASE_URL=old;
 }
});
