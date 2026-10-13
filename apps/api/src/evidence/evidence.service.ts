import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
@Injectable()
export class EvidenceService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async report(t:string,w:string,b:string,u:string,days:number){
  await this.access.brand(t,w,b,u);
  const since=new Date(Date.now()-days*86400000);
  const [brand,posts,approvals,reminders,rehearsals]=await Promise.all([
   this.db.brand.findUniqueOrThrow({where:{id:b},select:{id:true,name:true,locale:true,publishingPaused:true}}),
   this.db.contentPost.findMany({where:{brandId:b,createdAt:{gte:since}},take:500,
    orderBy:{createdAt:'desc'},select:{id:true,state:true,createdAt:true,versions:{orderBy:{number:'desc'},take:1,select:{number:true,createdAt:true}}}}),
   this.db.approvalRequest.findMany({where:{postVersion:{post:{brandId:b}},createdAt:{gte:since}},
    take:500,orderBy:{createdAt:'desc'},select:{id:true,state:true,expiresAt:true,reviewedAt:true,
      postVersion:{select:{number:true,postId:true}}}}),
   this.db.calendarSlot.findMany({where:{brandId:b,scheduledAt:{gte:since}},take:500,
    orderBy:{scheduledAt:'desc'},select:{id:true,postId:true,state:true,network:true,scheduledAt:true}}),
   this.db.dispatchRehearsal.findMany({where:{brandId:b,createdAt:{gte:since}},take:500,
    orderBy:{createdAt:'desc'},select:{id:true,network:true,postId:true,createdAt:true,results:true}}),
  ]);
  const categories=[
   {type:'internal_post',count:posts.length,items:posts.map(x=>({id:x.id,state:x.state,createdAt:x.createdAt,revision:x.versions[0]?.number||0}))},
   {type:'human_review',count:approvals.length,items:approvals.map(x=>({id:x.id,postId:x.postVersion.postId,
     version:x.postVersion.number,state:x.state,reviewedAt:x.reviewedAt,expiresAt:x.expiresAt}))},
   {type:'manual_reminder',count:reminders.length,items:reminders},
   {type:'dispatch_rehearsal',count:rehearsals.length,items:rehearsals},
  ];
  return {reportKind:'INTERNAL_EVIDENCE_ONLY',brand,windowDays:days,generatedAt:new Date().toISOString(),
   source:'tenant_postgresql_internal',categories,recordLimitPerCategory:500,
   coverage:categories.some(x=>x.count===500)?'TRUNCATED_TO_500_PER_CATEGORY':'FULL_WITHIN_WINDOW',
   externalProviderMetrics:{reach:null,impressions:null,engagement:null,followers:null,confirmedPublishedPosts:null},
   externalPublishingVerified:false,
   disclaimer:'This report documents internal actions, NOT verified social network posting, cost, impressions, reach, or engagement.'};
 }
}
