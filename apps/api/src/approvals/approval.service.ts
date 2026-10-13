import {ConflictException,ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';import {AccessService} from '../tenants/access.service';
@Injectable()
export class ApprovalService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async list(t:string,w:string,b:string,u:string){
  await this.access.brand(t,w,b,u);
  const approvals=await this.db.approvalRequest.findMany({where:{postVersion:{post:{brandId:b}}},
   orderBy:{createdAt:'desc'},take:100,select:{id:true,state:true,expiresAt:true,createdAt:true,
    reviewedAt:true,reviewNote:true,requestedById:true,reviewedById:true,postVersion:{select:{id:true,number:true,caption:true,postId:true}}}});
  return {approvals};
 }
 async request(t:string,w:string,b:string,u:string,input:{postId:string;expiresHours:number}){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  return this.db.$transaction(async tx=>{
   const post=await tx.contentPost.findFirst({where:{id:input.postId,brandId:b}});
   if(!post)throw new NotFoundException('Post missing');
   if(post.state!=='DRAFT')throw new ConflictException('Only draft posts can request approval');
   const version=await tx.postVersion.findFirst({where:{postId:post.id},orderBy:{number:'desc'}});
   if(!version)throw new NotFoundException('Draft has no version');
   if(await tx.approvalRequest.findUnique({where:{postVersionId:version.id}}))throw new ConflictException('This version already has an approval request');
   const request=await tx.approvalRequest.create({data:{postVersionId:version.id,requestedById:u,
    expiresAt:new Date(Date.now()+input.expiresHours*3600*1000)}});
   await tx.contentPost.update({where:{id:post.id},data:{state:'APPROVAL_PENDING'}});
   const [managers,reviewers]=await Promise.all([
     tx.membership.findMany({where:{tenantId:t,role:{in:['OWNER','ADMIN']}},select:{userId:true}}),
     tx.brandMember.findMany({where:{brandId:b,role:'APPROVER'},select:{userId:true}}),
   ]);
   const recipients=[...new Set([...managers.map(x=>x.userId),...reviewers.map(x=>x.userId)])].filter(id=>id!==u);
   if(recipients.length)await tx.socialNotification.createMany({data:recipients.map(recipientId=>({
     tenantId:t,recipientId,eventKey:'approval:'+request.id,subject:'New content approval',
     message:'A content draft is ready for your review in the Social-Media dashboard.',
   })),skipDuplicates:true});
   await tx.platformAuditEvent.create({data:{actorId:u,action:'content.approval.request',
    resourceType:'content_post',resourceId:post.id,details:{brandId:b,version:version.number}}});
   return {request};
  });
 }
 async review(t:string,w:string,b:string,u:string,id:string,input:{decision:'APPROVED'|'REJECTED';note:string}){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','APPROVER']);
  const request=await this.db.approvalRequest.findUnique({where:{id},include:{postVersion:{include:{post:true}}}});
  if(!request||request.postVersion.post.brandId!==b)throw new NotFoundException('Approval not found');
  if(request.requestedById===u)throw new ForbiddenException('Four-eyes review: requester cannot approve their own post');
  if(request.state!=='PENDING')throw new ConflictException('Approval already decided');
  if(request.expiresAt<=new Date()){
   await this.db.approvalRequest.updateMany({where:{id,state:'PENDING'},data:{state:'EXPIRED'}});
   throw new ConflictException('Approval request expired');
  }
  return this.db.$transaction(async tx=>{
   const latest=await tx.postVersion.findFirst({where:{postId:request.postVersion.postId},orderBy:{number:'desc'}});
   if(latest?.id!==request.postVersionId)throw new ConflictException('Approval targets an outdated content version');
   const changed=await tx.approvalRequest.updateMany({where:{id,state:'PENDING',expiresAt:{gt:new Date()}},
    data:{state:input.decision,approvedAt:input.decision==='APPROVED'?new Date():null,
     reviewedAt:new Date(),reviewedById:u,reviewNote:input.note}});
   if(changed.count!==1)throw new ConflictException('Request already decided or expired');
   const updated=await tx.contentPost.updateMany({where:{id:request.postVersion.postId,state:'APPROVAL_PENDING'},
    data:{state:input.decision==='APPROVED'?'APPROVED':'DRAFT'}});
   if(updated.count!==1)throw new ConflictException('Post no longer waiting for approval');
   if(request.requestedById)await tx.socialNotification.create({
     data:{tenantId:t,recipientId:request.requestedById,eventKey:'decision:'+request.id,
       subject:'Content review '+input.decision.toLowerCase(),message:'A reviewer has decided on your content submission.'}
   });
   await tx.platformAuditEvent.create({data:{actorId:u,action:'content.approval.'+input.decision.toLowerCase(),
    resourceType:'content_post',resourceId:request.postVersion.postId,details:{brandId:b,requestId:id}}});
   return {state:input.decision,approvedVersionId:input.decision==='APPROVED'?request.postVersionId:null};
  });
 }
}
