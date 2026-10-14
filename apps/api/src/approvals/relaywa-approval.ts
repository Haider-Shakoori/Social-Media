import {createHmac,timingSafeEqual} from 'node:crypto';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const phone=/^[1-9][0-9]{6,14}$/;
const baseUrl=(value:string):URL=>{
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)
  throw Error('RelayWA approval bridge requires an HTTPS API origin');
 return u;
};
/** RelayWA's public API is POST /api/v1/sessions/:id/messages/text.
 * Its incoming webhook includes only a messageId, not the text. The receiver
 * must validate HMAC, resolve that message through messages.read and verify
 * the matched account's pre-verified phone and in-app APPROVER role.
 */
export function relaywaApprovalText(input:{requestId:string;versionNumber:number;caption:string;
 expiresAt:Date;dashboardUrl:string}):string{
 if(!uuid.test(input.requestId)||!Number.isInteger(input.versionNumber)||input.versionNumber<1)
  throw Error('Invalid approval reference');
 const site=new URL(input.dashboardUrl);
 if(site.protocol!=='https:'||site.hostname!=='socials.businessos.af')
  throw Error('Invalid Social-Media review host');
 site.pathname='/dashboard';
 site.search='';site.hash='';
 site.searchParams.set('approvalRequest',input.requestId);
 const excerpt=input.caption.slice(0,400).replace(/[\x00-\x1f]/g,' ').trim();
 return [
  'Social-Media Manager — Instagram post approval',
  'Version '+input.versionNumber+' | Expires '+input.expiresAt.toISOString(),
  'Draft: '+excerpt,
  'Open '+site.toString(),
  'Approve or Reject in the authenticated dashboard.',
  'Reply commands alone do not authorize publishing until your WhatsApp number is verified and linked to a reviewer account.',
 ].join('\n');
}
export async function relaywaSendApproval(input:{requestId:string;recipientPhone:string;message:string;
 sessionId:string;apiOrigin:string;apiKey:string},fetcher:typeof fetch=fetch):Promise<{accepted:true}>{
 if(process.env.RELAYWA_APPROVALS_ENABLED!=='true')throw Error('RelayWA approval notifications are disabled');
 if(!uuid.test(input.requestId)||!uuid.test(input.sessionId)||!phone.test(input.recipientPhone))
  throw Error('Invalid session, approval, or recipient');
 if(!input.apiKey.startsWith('rw_')||input.apiKey.length<20)
  throw Error('RelayWA API credential missing');
 const origin=baseUrl(input.apiOrigin);
 const url=new URL('/api/v1/sessions/'+encodeURIComponent(input.sessionId)+'/messages/text',origin);
 let response:Response;
 try{
  response=await fetcher(url.toString(),{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),
   headers:{Authorization:'Bearer '+input.apiKey,'Content-Type':'application/json'},
   body:JSON.stringify({to:input.recipientPhone,text:input.message,
    clientMessageId:'social-approval-'+input.requestId})});
 }catch{throw Error('RelayWA delivery not confirmed; do not auto-resend');}
 if(!response.ok)throw Error('RelayWA rejected approval request; do not auto-resend');
 return {accepted:true};
}
/** Implements RelayWA's HMAC(timestamp+'.'+raw body) contract. Do not approve
 * from an unsigned webhook or from a sender number taken on faith.
 */
export function verifyRelaywaSignature(rawBody:Buffer,timestamp:string,signature:string,
 secret:string,now=Math.floor(Date.now()/1000)):boolean{
 if(!secret||!/^\d{10}$/.test(timestamp)||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;
 if(Math.abs(now-Number(timestamp))>300)return false;
 const expected=createHmac('sha256',secret).update(timestamp+'.').update(rawBody).digest();
 const provided=Buffer.from(signature.slice(7),'hex');
 return provided.length===expected.length&&timingSafeEqual(provided,expected);
}
export type RelaywaInboundReference={
 eventId:string;sessionId:string;messageId:string;senderPhone:string;
};
/** Extract reference only, never trust the webhook with the decision body.
 * Fetch the messageId using a scoped RelayWA messages.read credential.
 */
export function inboundRelaywaReference(payload:unknown,expectedSessionId:string):RelaywaInboundReference|null{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return null;
 const p=payload as Record<string,unknown>;
 if(p.type!=='message.received'||p.sessionId!==expectedSessionId||typeof p.id!=='string'||
  !p.data||typeof p.data!=='object'||Array.isArray(p.data))return null;
 const d=p.data as Record<string,unknown>;
 if(typeof d.messageId!=='string'||!uuid.test(d.messageId)||d.messageType!=='text'||
  typeof d.senderPhone!=='string'||!phone.test(d.senderPhone)||typeof d.chatJid!=='string'||
  d.chatJid.endsWith('@g.us'))return null;
 return {eventId:p.id,sessionId:expectedSessionId,messageId:d.messageId,senderPhone:d.senderPhone};
}
export function parseReviewReply(raw:string):{decision:'APPROVED'|'REJECTED';requestId:string}|null{
 const match=/^\s*(APPROVE|ACCEPT|REJECT)\s+([0-9a-f-]{36})\s*$/i.exec(raw);
 if(!match||!uuid.test(match[2]))return null;
 return {decision:match[1].toUpperCase()==='REJECT'?'REJECTED':'APPROVED',requestId:match[2]};
}
