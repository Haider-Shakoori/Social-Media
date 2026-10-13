import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
@Injectable()
export class AnalyticsService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async summary(tenantId:string,workspaceId:string,brandId:string,userId:string,days:number){
  await this.access.brand(tenantId,workspaceId,brandId,userId);
  const start=new Date(Date.now()-days*86400000);
  const [posts,approved,rejected,scheduled,manualDue,connected]=await Promise.all([
   this.db.contentPost.count({where:{brandId,createdAt:{gte:start}}}),
   this.db.approvalRequest.count({where:{postVersion:{post:{brandId}},state:'APPROVED',reviewedAt:{gte:start}}}),
   this.db.approvalRequest.count({where:{postVersion:{post:{brandId}},state:'REJECTED',reviewedAt:{gte:start}}}),
   this.db.calendarSlot.count({where:{brandId,createdAt:{gte:start}}}),
   this.db.calendarSlot.count({where:{brandId,state:'MANUAL_DUE',updatedAt:{gte:start}}}),
   this.db.socialConnection.count({where:{brandId,state:{in:['CONNECTED','LIMITED']}}}),
  ]);
  const records=await this.db.contentPost.findMany({where:{brandId,createdAt:{gte:start}},
   select:{createdAt:true},take:2000,orderBy:{createdAt:'desc'}});
  const byDay=new Map<string,number>();
  for(let i=0;i<days;i++){
   const date=new Date(Date.now()-(days-1-i)*86400000).toISOString().slice(0,10);
   byDay.set(date,0);
  }
  for(const p of records){
   const day=p.createdAt.toISOString().slice(0,10);
   if(byDay.has(day))byDay.set(day,(byDay.get(day)||0)+1);
  }
  return {
   source:'internal_first_party_database',windowDays:days,asOf:new Date().toISOString(),
   metrics:{draftPostsCreated:posts,approvalsGranted:approved,approvalsRejected:rejected,
    calendarRemindersCreated:scheduled,manualRemindersDue:manualDue,linkedAccounts:connected},
   dailyDrafts:Array.from(byDay,([date,count])=>({date,count})),
   coverage:records.length===2000?'daily_preview_truncated_2000':'complete_for_selected_window',
   providerEngagement:null,providerReach:null,providerImpressions:null,providerFollowerGrowth:null,
   limitation:'No external Meta or X insights are collected. Linked account count does not imply permission to publish. No fabricated metrics.',
  };
 }
}
