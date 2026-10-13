import {Injectable,OnModuleDestroy,OnModuleInit,ServiceUnavailableException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
@Injectable()
export class SchedulerService implements OnModuleInit,OnModuleDestroy{
 private timer:ReturnType<typeof setInterval>|null=null;
 constructor(private readonly db:PrismaService){}
 onModuleInit(){
  if(process.env.MANUAL_REMINDER_SCHEDULER_ENABLED==='true'){
   this.timer=setInterval(()=>{void this.runOnce().catch(e=>console.error('Manual reminder reconciliation failed',e instanceof Error?e.message:'unknown'));},60_000);
   this.timer.unref();
  }
 }
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
 async runOnce(){
  if(process.env.MANUAL_REMINDER_SCHEDULER_ENABLED!=='true'){
   throw new ServiceUnavailableException('Manual reminder reconciler is off');
  }
  const due=await this.db.calendarSlot.findMany({where:{state:'PLANNED',scheduledAt:{lte:new Date()}},
   orderBy:{scheduledAt:'asc'},take:100,select:{id:true,brandId:true,postId:true,network:true}});
  let processed=0;
  for(const slot of due){
   const result=await this.db.$transaction(async tx=>{
    const changed=await tx.calendarSlot.updateMany({where:{id:slot.id,state:'PLANNED',scheduledAt:{lte:new Date()}},
     data:{state:'MANUAL_DUE'}});
    if(!changed.count)return false;
    const brand=await tx.brand.findUnique({where:{id:slot.brandId},select:{archivedAt:true,publishingPaused:true,workspace:{select:{tenantId:true}}}});
    if(!brand||brand.archivedAt)return true;
    const post=await tx.contentPost.findUnique({where:{id:slot.postId},select:{state:true}});
    // Even when approved, no API call occurs: the notification requests human posting.
    const action=post?.state==='APPROVED'&&!brand.publishingPaused?'Ready for manual publishing':'Requires manual review';
    const members=await tx.membership.findMany({where:{tenantId:brand.workspace.tenantId,role:{in:['OWNER','ADMIN']}},
     select:{userId:true}});
    if(members.length)await tx.socialNotification.createMany({data:members.map(m=>({
     tenantId:brand.workspace.tenantId,recipientId:m.userId,eventKey:'manual_due:'+slot.id,
     subject:action,message:'A '+slot.network+' calendar item is due. Open the dashboard and publish manually only if approved.',
    })),skipDuplicates:true});
    if(post?.state==='APPROVED'&&!brand.publishingPaused){
     await tx.contentPost.updateMany({where:{id:slot.postId,state:'APPROVED'},data:{state:'MANUAL_REQUIRED'}});
    }
    return true;
   });
   if(result)processed++;
  }
  return {processed,examined:due.length,mode:'manual_only',externalPostsSent:0,
   notice:'Never sends social API calls. Non-approved content remains under manual review.'};
 }
}
