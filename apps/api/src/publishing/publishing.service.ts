import {ConflictException,ForbiddenException,Injectable,NotFoundException,ServiceUnavailableException} from '@nestjs/common';
import {Prisma} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import {EntitlementsService,monthStartUTC} from '../billing/entitlements.service';
import {metaPublishingBlockers,supportedMetaFormat,type PublishGate} from './guard';
import {verifyFacebookRemote} from './reconcile';

type Db=Prisma.TransactionClient;
export async function prepareMetaTarget(db:Db,brandId:string,postId:string,connectionId:string,
 approvedVersionId?:string,subscriptionActive=true){
 const [post,connection,global]=await Promise.all([
  db.contentPost.findFirst({where:{id:postId,brandId},include:{
   brand:true,versions:{orderBy:{number:'desc'},take:1,include:{approvals:true}},
  }}),
  db.socialConnection.findFirst({where:{id:connectionId,brandId}}),
  db.platformSetting.findUnique({where:{key:'global_social_pause'}}),
 ]);
 if(!post||!connection)throw new NotFoundException('Post or social account not found in brand');
 const version=post.versions[0];
 if(!version)throw new ConflictException('Post has no content version');
 const approval=version.approvals[0];
 const policy=await db.socialProviderPolicy.findUnique({where:{network:connection.platform}});
 const gate:PublishGate={
  network:connection.platform,featureEnabled:process.env.META_PUBLISHING_ENABLED==='true'&&process.env.META_CONNECT_ENABLED==='true',
  globalPaused:global?.value!==false,brandPaused:post.brand.publishingPaused,
  archived:!!post.brand.archivedAt,
  mode:connection.mode,connectionState:connection.state,connectionPaused:!!connection.pausedAt,
  tokenExpiresAt:connection.tokenExpiresAt,
  scopes:connection.tokenScopes,policyState:policy?.rolloutState||'PLANNED',
  operatorEnabled:policy?.operatorEnabled===true,apiApproved:policy?.apiApproved===true,
  productionVerified:policy?.productionVerified===true,
  subscriptionActive,approvedVersionMatches:(!approvedVersionId||approvedVersionId===version.id)&&
   ['APPROVED','SCHEDULED','PUBLISHING'].includes(post.state),
  approvalGranted:approval?.state==='APPROVED'&&!!approval.approvedAt,
  approvedByAnotherUser:!!approval?.requestedById&&!!approval?.reviewedById&&
   approval.requestedById!==approval.reviewedById,
  contentSupported:supportedMetaFormat(connection.platform,version.mediaUrls),
 };
 return {post,connection,version,blockers:metaPublishingBlockers(gate)};
}

@Injectable()
export class PublishingService {
 constructor(private readonly db:PrismaService,private readonly access:AccessService,
  private readonly billing:EntitlementsService){}
 async queue(t:string,w:string,b:string,user:string,input:{postId:string;connectionId:string;scheduledAt?:string}){
  await this.access.brand(t,w,b,user,['OWNER','ADMIN','EDITOR']);
  if(process.env.META_PUBLISHING_ENABLED!=='true')
   throw new ServiceUnavailableException('Automatic publishing is disabled; use manual export');
  const due=input.scheduledAt?new Date(input.scheduledAt):new Date();
  if(!Number.isFinite(due.getTime())||due.getTime()>Date.now()+90*86400000||
    due.getTime()<Date.now()-60_000)throw new ConflictException('Publish time outside allowed window');
  return this.billing.inTransaction(t,async(tx,subscription)=>{
   const existing=await tx.postTarget.findFirst({where:{postId:input.postId,
    socialConnectionId:input.connectionId,post:{brandId:b},socialConnection:{brandId:b}}});
   if(existing){
    if(existing.state==='SCHEDULED')return {target:{id:existing.id,state:existing.state},alreadyQueued:true};
    throw new ConflictException('Target already processed; never resend automatically');
   }
   const ready=await prepareMetaTarget(tx,b,input.postId,input.connectionId);
   if(ready.blockers.length)throw new ForbiddenException('Publish not ready: '+ready.blockers.join(', '));
   const monthStart=monthStartUTC();
   const key={tenantId:t,metric:'SCHEDULED_POST' as const,monthStart};
   const count=await tx.usageBucket.findUnique({where:{tenantId_metric_monthStart:key}});
   if((count?.used||0)>=subscription.monthlyScheduledPosts)
    throw new ForbiddenException('Monthly scheduling allowance exhausted');
   const target=await tx.postTarget.create({data:{postId:input.postId,
    socialConnectionId:input.connectionId,approvedVersionId:ready.version.id,
    state:'SCHEDULED',scheduledAt:due},select:{id:true,state:true,scheduledAt:true}});
   await tx.usageBucket.upsert({where:{tenantId_metric_monthStart:key},
    create:{...key,used:1},update:{used:{increment:1}}});
   await tx.contentPost.updateMany({where:{id:input.postId,state:{in:['APPROVED','SCHEDULED']}},
    data:{state:'SCHEDULED'}});
   await tx.platformAuditEvent.create({data:{actorId:user,action:'content.publish.queued',
    resourceType:'post_target',resourceId:target.id,details:{tenantId:t,brandId:b,postId:input.postId}}});
   return {target,alreadyQueued:false,notice:'Durable job queued. Every dispatch rechecks account, brand and exact approval.'};
  });
 }
 async reconcile(t:string,w:string,b:string,user:string,targetId:string){
  await this.access.brand(t,w,b,user,['OWNER','ADMIN']);
  const target=await this.db.postTarget.findFirst({where:{id:targetId,post:{brandId:b}},
   include:{socialConnection:true}});
  if(!target)throw new NotFoundException('Publishing target unavailable');
  if(target.state!=='UNCERTAIN')return {state:target.state,verified:false,automaticRetry:false};
  if(!target.remoteId||!target.socialConnection.encryptedCredentials||
     target.socialConnection.platform!=='facebook'||!target.socialConnection.externalAccountId)
    return {state:'UNCERTAIN',verified:false,automaticRetry:false,
     nextStep:'Check the actual provider account manually; do not retry this target without resolving duplication risk'};
  if(!await verifyFacebookRemote({remoteId:target.remoteId,
    pageId:target.socialConnection.externalAccountId,
    encryptedCredentials:target.socialConnection.encryptedCredentials}))
    return {state:'UNCERTAIN',verified:false,automaticRetry:false,
     nextStep:'Provider could not confirm this exact Page post'};
  const updated=await this.db.postTarget.updateMany({where:{id:targetId,state:'UNCERTAIN'},
   data:{state:'PUBLISHED',lastFailureCode:null}});
  if(updated.count)await this.db.platformAuditEvent.create({data:{actorId:user,
   action:'content.publish.reconciled',resourceType:'post_target',resourceId:targetId,
   details:{brandId:b,remoteId:target.remoteId}}});
  return {state:updated.count?'PUBLISHED':'UNCERTAIN',verified:Boolean(updated.count),automaticRetry:false};
 }
 async list(t:string,w:string,b:string,user:string){
  await this.access.brand(t,w,b,user);
  const targets=await this.db.postTarget.findMany({where:{post:{brandId:b}},take:100,
   orderBy:{createdAt:'desc'},select:{id:true,postId:true,socialConnectionId:true,state:true,
    scheduledAt:true,attemptedAt:true,remoteId:true,lastFailureCode:true,createdAt:true}});
  return {targets,notice:'UNCERTAIN jobs are never retried automatically; check provider before reconciliation.'};
 }
}
