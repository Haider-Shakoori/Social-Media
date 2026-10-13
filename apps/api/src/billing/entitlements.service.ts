import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Subscription, UsageMetric } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export function effectiveState(s:Pick<Subscription,'state'|'periodEnd'|'graceEndsAt'>,now=new Date()){
 if(s.state==='SUSPENDED'||s.state==='CANCELLED'||s.state==='EXPIRED')return s.state;
 if(s.state==='GRACE')return s.graceEndsAt&&s.graceEndsAt>now?'GRACE':'EXPIRED';
 return s.periodEnd>now?s.state:'EXPIRED';
}
export function monthStartUTC(d=new Date()){return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1));}
type CountQuota='BRANDS'|'SEATS'|'CONNECTIONS';
type CreditMetric='AI_TEXT'|'AI_IMAGE'|'SCHEDULED_POST';
const limits={BRANDS:'maxBrands',SEATS:'maxSeats',CONNECTIONS:'maxConnections'} as const;
const creditLimits={AI_TEXT:'monthlyAiText',AI_IMAGE:'monthlyAiImage',SCHEDULED_POST:'monthlyScheduledPosts'} as const;
@Injectable()
export class EntitlementsService{
 constructor(private readonly db:PrismaService){}
 async inTransaction<T>(tenantId:string,action:(tx:Prisma.TransactionClient,subscription:Subscription)=>Promise<T>):Promise<T>{
  for(let attempt=0;attempt<3;attempt++)try{
   return await this.db.$transaction(async tx=>{
    const rows=await tx.$queryRaw<{id:string}[]>`SELECT id FROM "subscriptions" WHERE tenant_id=${tenantId}::uuid FOR UPDATE`;
    if(!rows.length)throw new NotFoundException('Subscription not found');
    const s=await tx.subscription.findUniqueOrThrow({where:{tenantId}});
    if(!['TRIALING','ACTIVE','GRACE'].includes(effectiveState(s)))throw new ForbiddenException('Subscription inactive or expired');
    return action(tx,s);
   },{isolationLevel:'Serializable',timeout:12000});
  }catch(e){if(attempt<2&&typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2034')continue;throw e;}
  throw new ConflictException('Concurrent quota update; retry');
 }
 async assertCount(tx:Prisma.TransactionClient,s:Subscription,metric:CountQuota,additional=1){
  let used=0;
  if(metric==='BRANDS')used=await tx.brand.count({where:{workspace:{tenantId:s.tenantId},archivedAt:null}});
  else if(metric==='SEATS'){
   const current=await tx.membership.count({where:{tenantId:s.tenantId}});
   const pending=await tx.tenantInvitation.count({where:{tenantId:s.tenantId,acceptedAt:null,revokedAt:null,expiresAt:{gt:new Date()}}});
   used=current+pending;
  }else used=await tx.socialConnection.count({where:{brand:{workspace:{tenantId:s.tenantId},archivedAt:null}},state:{in:['CONNECTED','LIMITED']}}});
  if(used+additional>s[limits[metric]])throw new ForbiddenException(metric.toLowerCase()+' limit reached');
 }
 async consume(tenantId:string,metric:CreditMetric,quantity=1){
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>10000)throw new ConflictException('Invalid quantity');
  return this.inTransaction(tenantId,async(tx,s)=>{
   const limit=s[creditLimits[metric]],monthStart=monthStartUTC();
   const key={tenantId,metric:metric as UsageMetric,monthStart};
   const existing=await tx.usageBucket.findUnique({where:{tenantId_metric_monthStart:key}});
   if((existing?.used||0)+quantity>limit)throw new ForbiddenException('Monthly usage limit exceeded');
   const bucket=await tx.usageBucket.upsert({where:{tenantId_metric_monthStart:key},create:{...key,used:quantity},update:{used:{increment:quantity}}});
   return {used:bucket.used,limit};
  });
 }
}
