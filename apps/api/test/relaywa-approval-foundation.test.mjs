import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHmac} from 'node:crypto';
const require=createRequire(import.meta.url);
const {relaywaApprovalText,relaywaSendApproval,verifyRelaywaSignature,
 inboundRelaywaReference,parseReviewReply}=require('../dist/approvals/relaywa-approval.js');

const id='ae90be91-bc0f-4d16-a7ea-9e87ff613743';
const session='2a66b0e2-fd0d-4825-965b-932adcd9242c';
const text=relaywaApprovalText({requestId:id,versionNumber:3,caption:'Summer launch',
 expiresAt:new Date('2026-10-18T01:00:00Z'),dashboardUrl:'https://socials.businessos.af/dashboard'});
test('RelayWA approval text includes version and authenticated review destination, never a bearer token',()=>{
 assert.ok(text.includes('Version 3'));
 assert.ok(text.includes(id));
 assert.ok(text.includes('https://socials.businessos.af/dashboard?approvalRequest='));
 assert.ok(!text.includes('token='));
 assert.throws(()=>relaywaApprovalText({requestId:id,versionNumber:1,caption:'hi',
  expiresAt:new Date(),dashboardUrl:'https://evil.example/'}));
});
test('RelayWA outbound delivery respects disabled-by-default gate and exact API shape',async()=>{
 const prev=process.env.RELAYWA_APPROVALS_ENABLED;
 const input={requestId:id,recipientPhone:'15551234567',message:text,sessionId:session,
  apiOrigin:'https://relaywa.example.test',apiKey:'rw_live_abcdefghijklmnopqrstuvwxyz'};
 let count=0;
 try{
  delete process.env.RELAYWA_APPROVALS_ENABLED;
  await assert.rejects(relaywaSendApproval(input,async()=>{count++;return Response.json({success:true});}));
  assert.equal(count,0);
  process.env.RELAYWA_APPROVALS_ENABLED='true';
  const result=await relaywaSendApproval(input,async(url,opts)=>{
   count++;
   assert.equal(url,'https://relaywa.example.test/api/v1/sessions/'+session+'/messages/text');
   assert.equal(opts.method,'POST');
   assert.equal(opts.redirect,'error');
   assert.ok(!url.includes(input.apiKey));
   assert.equal(opts.headers.Authorization,'Bearer '+input.apiKey);
   const body=JSON.parse(opts.body);
   assert.equal(body.clientMessageId,'social-approval-'+id);
   assert.equal(body.to,input.recipientPhone);
   return Response.json({success:true});
  });
  assert.deepEqual(result,{accepted:true});
  assert.equal(count,1);
  await assert.rejects(relaywaSendApproval(input,async()=>{throw Error('network timeout');}),
   /do not auto-resend/);
 }finally{
  if(prev===undefined)delete process.env.RELAYWA_APPROVALS_ENABLED;
  else process.env.RELAYWA_APPROVALS_ENABLED=prev;
 }
});
test('Signed incoming RelayWA webhook verifies exact raw body, timestamp, and anti-tamper MAC',()=>{
 const secret='test-only-webhook-secret',timestamp='1792026000';
 const raw=Buffer.from(JSON.stringify({id:'1002',type:'message.received',sessionId:session,
  data:{messageId:id,senderPhone:'15551234567',messageType:'text',chatJid:'15551234567@s.whatsapp.net'}}));
 const signature='sha256='+createHmac('sha256',secret).update(timestamp+'.').update(raw).digest('hex');
 assert.equal(verifyRelaywaSignature(raw,timestamp,signature,secret,1792026000),true);
 assert.equal(verifyRelaywaSignature(Buffer.from('tampered'),timestamp,signature,secret,1792026000),false);
 assert.equal(verifyRelaywaSignature(raw,timestamp,signature,secret,1792026400),false);
 assert.equal(verifyRelaywaSignature(raw,timestamp,'sha256=bad',secret,1792026000),false);
 const event=JSON.parse(raw.toString());
 assert.equal(inboundRelaywaReference(event,session).messageId,id);
 assert.equal(inboundRelaywaReference({...event,sessionId:'bad'},session),null);
 assert.equal(inboundRelaywaReference({...event,data:{...event.data,chatJid:'a@g.us'}},session),null);
 assert.equal(inboundRelaywaReference({...event,data:{...event.data,messageType:'image'}},session),null);
});
test('Approve/Reject command parser is strict and cannot authorize any action itself',()=>{
 assert.deepEqual(parseReviewReply('APPROVE '+id),{decision:'APPROVED',requestId:id});
 assert.deepEqual(parseReviewReply('ACCEPT '+id),{decision:'APPROVED',requestId:id});
 assert.deepEqual(parseReviewReply('REJECT '+id),{decision:'REJECTED',requestId:id});
 for(const bad of ['approve 1234','delete '+id,'APPROVE '+id+' NOW','','ACCEPT']){
  assert.equal(parseReviewReply(bad),null);
 }
});
