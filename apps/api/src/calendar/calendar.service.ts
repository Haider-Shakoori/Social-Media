import {BadRequestException,ConflictException,ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import {EntitlementsService,monthStartUTC} from '../billing/entitlements.service';
import type {z} from 'zod';
import {slotInput} from './calendar.controller';
import {randomUUID} from 'node:crypto';
@Injectable()
export class CalendarService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService,private readonly billing:EntitlementsService){}
 async list(t:string,w:string,b:string,u:string){
  await this.access.brand(t,w,b,u);
  return {slots:await this.db.calendarSlot.findMany({where:{brandId:b},
   orderBy:{scheduledAt:'asc'},take:100,select:{id:true,postId:true,network:true,timezone:true,scheduledAt:true,state:true,seriesId:true}}),
   notice:'Calendar slots are planning reminders only; no automated publishing is enabled.'};
 }
 async create(t:string,w:string,b:string,u:string,input:z.infer<typeof slotInput>){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  try{new Intl.DateTimeFormat('en',{timeZone:input.timezone});}catch{throw new BadRequestException('Invalid IANA timezone');}
  if(input.repeat==='once'&&input.count!==1)throw new BadRequestException('One-time slot must have count=1');
  const post=await this.db.contentPost.findFirst({where:{id:input.postId,brandId:b}});
  if(!post)throw new NotFoundException('Post does not belong to brand');
  const first=new Date(input.scheduledAt),minutes=24*60*60*1000,interval=input.repeat==='weekly'?7*minutes:minutes;
  const dates=Array.from({length:input.count},(_,i)=>new Date(first.getTime()+i*interval));
  if(first.getTime()<Date.now()+60_000||dates.at(-1)!.getTime()>Date.now()+90*minutes){
   throw new BadRequestException('Schedule must be 1 minute to 90 days in the future');
  }
  // Reserve quota and write exact series IDs in ONE serialized database transaction.
  const seriesId=randomUUID();
  const result=await this.billing.inTransaction(t,async(tx,subscription)=>{
   const monthStart=monthStartUTC();
   const key={tenantId:t,metric:'SCHEDULED_POST' as const,monthStart};
   const current=await tx.usageBucket.findUnique({where:{tenantId_metric_monthStart:key}});
   if((current?.used||0)+dates.length>subscription.monthlyScheduledPosts){
    throw new ForbiddenException('Monthly scheduling allowance exhausted');
   }
   const existingPost=await tx.contentPost.findFirst({where:{id:input.postId,brandId:b}});
   if(!existingPost)throw new NotFoundException('Post no longer belongs to brand');
   const used=await tx.usageBucket.upsert({where:{tenantId_metric_monthStart:key},
    create:{...key,used:dates.length},update:{used:{increment:dates.length}}});
   await tx.calendarSlot.createMany({data:dates.map(scheduledAt=>({
    brandId:b,postId:input.postId,network:input.network,timezone:input.timezone,scheduledAt,seriesId,
   }))});
   const slots=await tx.calendarSlot.findMany({where:{brandId:b,seriesId},
    select:{id:true,scheduledAt:true,network:true,state:true}});
   return {slots,usage:{used:used.used,limit:subscription.monthlyScheduledPosts}};
  });
  return {...result,notice:'These are manual reminders. UTC recurrence may shift local clock time during DST.'};
 }
 async cancel(t:string,w:string,b:string,u:string,id:string){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  const changed=await this.db.calendarSlot.updateMany({where:{id,brandId:b,state:'PLANNED'},data:{state:'CANCELLED'}});
  if(!changed.count)throw new ConflictException('Slot missing, already due or cancelled');
  return {cancelled:true,note:'Scheduling credits are not refunded'};
 }
}
