import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {effectiveState} from '../billing/entitlements.service';
import {prepareMetaTarget} from './publishing.service';
import {sendMetaPost,PublishOutcomeUnknown} from './meta-publisher';

const db=new PrismaClient();
let running=false;
export async function processDueMetaTargets(){
 if(process.env.META_PUBLISHING_ENABLED!=='true'||
   (process.env.META_CONNECT_ENABLED!=='true'&&
    !(process.env.INSTAGRAM_CONNECT_ENABLED==='true'&&process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED==='true')))return;
 if(running)return;
 running=true;
 try{
  // Expired in-flight claims are UNCERTAIN, never rescheduled: Meta lacks an idempotent publish API.
  const stale=new Date(Date.now()-15*60*1000);
  await db.postTarget.updateMany({where:{state:'PUBLISHING',attemptedAt:{lt:stale}},
   data:{state:'UNCERTAIN',lastFailureCode:'worker_outcome_unknown'}});
  const targets=await db.postTarget.findMany({where:{state:'SCHEDULED',scheduledAt:{lte:new Date()}},
   orderBy:{scheduledAt:'asc'},take:5});
  for(const target of targets){
   if(!target.approvedVersionId){
    await db.postTarget.updateMany({where:{id:target.id,state:'SCHEDULED'},
     data:{state:'MANUAL_REQUIRED',lastFailureCode:'missing_approved_version'}});
    continue;
   }
   const post=await db.contentPost.findUnique({where:{id:target.postId},select:{
    brandId:true,brand:{select:{workspace:{select:{tenantId:true}}}},
   }});
   if(!post)continue;
   const subscription=await db.subscription.findUnique({where:{tenantId:post.brand.workspace.tenantId}});
   const active=Boolean(subscription&&['TRIALING','ACTIVE','GRACE'].includes(effectiveState(subscription)));
   const ready=await prepareMetaTarget(db,post.brandId,target.postId,target.socialConnectionId,
    target.approvedVersionId,active);
   if(!ready.connection.encryptedCredentials||!ready.connection.externalAccountId){
    ready.blockers.push('missing_credentials');
   }
   if(ready.blockers.length){
    await db.postTarget.updateMany({where:{id:target.id,state:'SCHEDULED'},
     data:{state:'MANUAL_REQUIRED',lastFailureCode:ready.blockers[0].slice(0,60)}});
    continue;
   }
   const claimed=await db.postTarget.updateMany({where:{id:target.id,state:'SCHEDULED',
    approvedVersionId:ready.version.id},data:{state:'PUBLISHING',attemptedAt:new Date()}});
   if(claimed.count!==1)continue;
   // Claim before sending. If the process crashes after sending, it will NEVER auto-resend.
   const checked=await prepareMetaTarget(db,post.brandId,target.postId,target.socialConnectionId,
    target.approvedVersionId,active);
   if(checked.blockers.length){
    await db.postTarget.updateMany({where:{id:target.id,state:'PUBLISHING'},
     data:{state:'MANUAL_REQUIRED',lastFailureCode:checked.blockers[0].slice(0,60)}});
    continue;
   }
   await db.contentPost.updateMany({where:{id:target.postId,state:{in:['SCHEDULED','APPROVED']}},
    data:{state:'PUBLISHING'}});
   try{
    const remoteId=await sendMetaPost({
     platform:ready.connection.platform as 'facebook'|'instagram',
     accountId:ready.connection.externalAccountId!,
     encryptedCredentials:ready.connection.encryptedCredentials!,
     caption:ready.version.caption,mediaUrls:ready.version.mediaUrls,
     grantedScopes:ready.connection.tokenScopes,
    });
    await db.postTarget.updateMany({where:{id:target.id,state:'PUBLISHING'},
     data:{state:'PUBLISHED',remoteId,lastFailureCode:null}});
    const remaining=await db.postTarget.count({where:{postId:target.postId,state:{not:'PUBLISHED'}}});
    if(!remaining)await db.contentPost.updateMany({where:{id:target.postId,state:'PUBLISHING'},
      data:{state:'PUBLISHED'}});
   }catch(error){
    // Includes remote timeouts, 5xx, lost response, DB errors: outcome may have succeeded.
    const reason=error instanceof PublishOutcomeUnknown?error.reason:'outcome_unknown';
    await db.postTarget.updateMany({where:{id:target.id,state:'PUBLISHING'},
     data:{state:'UNCERTAIN',lastFailureCode:reason.slice(0,60)}}).catch(()=>{});
    await db.contentPost.updateMany({where:{id:target.postId,state:'PUBLISHING'},
     data:{state:'UNCERTAIN'}}).catch(()=>{});
   }
  }
 }finally{running=false;}
}
async function main(){
 if(process.env.META_PUBLISHING_ENABLED!=='true'){
  console.log('Meta publisher disabled. No external publishing calls made.');
  return;
 }
 if(process.env.META_CONNECT_ENABLED!=='true'&&
   !(process.env.INSTAGRAM_CONNECT_ENABLED==='true'&&process.env.INSTAGRAM_IMAGE_PUBLISHING_ENABLED==='true'))
  throw Error('A reviewed provider must be enabled separately');
 console.log('Meta publisher running with database, provider and account safety gates');
 const timer=setInterval(()=>{void processDueMetaTargets().catch(()=>console.warn('Meta publish worker transient failure'));},6000);
 try{await processDueMetaTargets();}catch{console.warn('Meta worker first pass failed');}
 const shutdown=async()=>{clearInterval(timer);await db.$disconnect();process.exit(0);};
 process.once('SIGTERM',()=>{void shutdown();});
 process.once('SIGINT',()=>{void shutdown();});
}
if(require.main===module)main().catch(()=>{console.error('Meta publisher failed to start');process.exitCode=1;});
