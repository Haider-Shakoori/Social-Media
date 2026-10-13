import {BadRequestException,ConflictException,Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import {EntitlementsService} from '../billing/entitlements.service';
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
  // Capacity is reserved per requested reminder; not refunded when manually cancelled.
  const result=await this.billing.consume(t,'SCHEDULED_POST',input.count);
  const seriesId=input.count>1?randomUUID():null;
  const data=dates.map(scheduledAt=>({brandId:b,postId:input.postId,network:input.network,
   timezone:input.timezone,scheduledAt,seriesId}));
  const slots=await this.db.$transaction(async tx=>{
   await tx.calendarSlot.createMany({data});
   return tx.calendarSlot.findMany({where:{brandId:b,seriesId:seriesId||undefined,scheduledAt:{in:dates}},
    select:{id:true,scheduledAt:true,network:true,state:true}});
  });
  return {slots,usage:result,notice:'These are manual reminders. Daily/weekly repetition is UTC interval-based and may move local clock time at DST.'};
 }
 async cancel(t:string,w:string,b:string,u:string,id:string){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  const changed=await this.db.calendarSlot.updateMany({where:{id,brandId:b,state:'PLANNED'},data:{state:'CANCELLED'}});
  if(!changed.count)throw new ConflictException('Slot missing, already due or cancelled');
  return {cancelled:true,note:'Scheduling credits are not refunded'};
 }
}
