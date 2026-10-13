import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Subscription } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { effectiveState, monthStartUTC } from './entitlements.service';
import { planInput,planPatch,activateInput,invoiceInput,paymentInput } from './billing.dto';
import type { z } from 'zod';

type PlanInput=z.infer<typeof planInput>;
type PlanPatch=z.infer<typeof planPatch>;
type Activate=z.infer<typeof activateInput>;
type InvoiceInput=z.infer<typeof invoiceInput>;
type PaymentInput=z.infer<typeof paymentInput>;
const snapshot=(plan:{
 maxBrands:number;maxSeats:number;maxConnections:number;
 monthlyAiText:number;monthlyAiImage:number;monthlyScheduledPosts:number;
})=>({
 maxBrands:plan.maxBrands,maxSeats:plan.maxSeats,maxConnections:plan.maxConnections,
 monthlyAiText:plan.monthlyAiText,monthlyAiImage:plan.monthlyAiImage,monthlyScheduledPosts:plan.monthlyScheduledPosts,
});
function futureDate(base:Date,cycle:'MONTHLY'|'YEARLY'){
  // Clamp to the last day of the target month (Jan 31 => Feb 28/29).
  const step=cycle==='MONTHLY'?1:12;
  const target=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+step,1,
    base.getUTCHours(),base.getUTCMinutes(),base.getUTCSeconds(),base.getUTCMilliseconds()));
  const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(base.getUTCDate(),last));
  return target;
}
@Injectable()
export class BillingService {
 constructor(private readonly db:PrismaService){}
 private async checkTenant(userId:string,tenantId:string){
  const membership=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId}}});
  if(!membership)throw new NotFoundException('Tenant not found');
  if(!['OWNER','ADMIN'].includes(membership.role))throw new ForbiddenException('Billing access restricted');
 }
 private async record(tx:Prisma.TransactionClient,actorId:string,tenantId:string|null,action:string,details:Record<string,string|number|boolean|null>){
  await tx.billingAuditEvent.create({data:{actorId,tenantId,action,details}});
 }
 async publishedPlans(){
  const plans=await this.db.plan.findMany({where:{enabled:true,published:true,code:{not:'trial'}},select:{
    code:true,name:true,description:true,currency:true,monthlyPriceMinor:true,yearlyPriceMinor:true,
    maxBrands:true,maxSeats:true,maxConnections:true,monthlyAiText:true,monthlyAiImage:true,monthlyScheduledPosts:true,
  },orderBy:{createdAt:'asc'}});
  return {plans};
 }
 async tenantOverview(userId:string,tenantId:string){
  await this.checkTenant(userId,tenantId);
  const [subscription,buckets,brands,seats,pendingInvitations,connections,invoices,payments]=await Promise.all([
    this.db.subscription.findUnique({where:{tenantId},include:{plan:{select:{code:true,name:true,currency:true}}}}),
    this.db.usageBucket.findMany({where:{tenantId,monthStart:monthStartUTC()},select:{metric:true,used:true}}),
    this.db.brand.count({where:{workspace:{tenantId},archivedAt:null}}),
    this.db.membership.count({where:{tenantId}}),
    this.db.tenantInvitation.count({where:{tenantId,acceptedAt:null,revokedAt:null,expiresAt:{gt:new Date()}}}),
    this.db.socialConnection.count({where:{brand:{workspace:{tenantId},archivedAt:null},state:{in:['CONNECTED','LIMITED']}}}),
    this.db.invoice.findMany({where:{tenantId},select:{id:true,number:true,amountMinor:true,currency:true,status:true,issuedAt:true,paidAt:true,dueAt:true},orderBy:{issuedAt:'desc'},take:30}),
    this.db.paymentRecord.findMany({where:{tenantId},select:{id:true,amountMinor:true,currency:true,reference:true,state:true,createdAt:true,verifiedAt:true,invoiceId:true},orderBy:{createdAt:'desc'},take:30}),
  ]);
  if(!subscription)throw new NotFoundException('Subscription not found');
  return {
    subscription:{
      id:subscription.id,plan:subscription.plan,state:effectiveState(subscription),
      storedState:subscription.state,cycle:subscription.cycle,periodStart:subscription.periodStart,
      periodEnd:subscription.periodEnd,trialEndsAt:subscription.trialEndsAt,graceEndsAt:subscription.graceEndsAt,
      limits:snapshot(subscription),
    },
    usage:{
      brands,seats:seats+pendingInvitations,connections,
      aiText:buckets.find(x=>x.metric==='AI_TEXT')?.used||0,
      aiImage:buckets.find(x=>x.metric==='AI_IMAGE')?.used||0,
      scheduledPosts:buckets.find(x=>x.metric==='SCHEDULED_POST')?.used||0,
      monthStart:monthStartUTC(),
    },
    invoices,payments,
  };
 }
 async listPlans(){
  return {plans:await this.db.plan.findMany({orderBy:{createdAt:'asc'},take:100})};
 }
 async createPlan(actorId:string,input:PlanInput){
  if(input.code==='trial')throw new BadRequestException('Reserved trial plan cannot be created');
  if(input.published&&!input.enabled)throw new BadRequestException('Cannot publish a disabled plan');
  try{
   return this.db.$transaction(async tx=>{
    const plan=await tx.plan.create({data:input});
    await this.record(tx,actorId,null,'plan.create',{plan:plan.code});
    return {plan};
   });
  }catch(e){
   if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002')throw new ConflictException('Plan code already exists');
   throw e;
  }
 }
 async updatePlan(actorId:string,code:string,input:PlanPatch){
  if(code==='trial'&&('trialDays'in input || input.enabled===false))throw new BadRequestException('Trial default is protected');
  return this.db.$transaction(async tx=>{
   const existing=await tx.plan.findUnique({where:{code}});
   if(!existing)throw new NotFoundException('Plan not found');
   if(input.published===true && (input.enabled===false || (input.enabled===undefined&&!existing.enabled)))throw new BadRequestException('Disabled plan cannot be public');
   const plan=await tx.plan.update({where:{code},data:input});
   await this.record(tx,actorId,null,'plan.update',{plan:code});
   return {plan};
  });
 }
 async listTenants(){
  return {tenants:await this.db.tenant.findMany({select:{
    id:true,name:true,slug:true,subscription:{select:{id:true,state:true,periodEnd:true,plan:{select:{code:true,name:true}}}},
  },orderBy:{createdAt:'desc'},take:100})};
 }
 async tenantForPlatform(tenantId:string){
  const tenant=await this.db.tenant.findUnique({where:{id:tenantId},select:{id:true,name:true,slug:true}});
  if(!tenant)throw new NotFoundException('Tenant not found');
  const [subscription,invoices,payments]=await Promise.all([
    this.db.subscription.findUnique({where:{tenantId},include:{plan:true}}),
    this.db.invoice.findMany({where:{tenantId},select:{id:true,number:true,amountMinor:true,currency:true,status:true,issuedAt:true},take:50,orderBy:{issuedAt:'desc'}}),
    this.db.paymentRecord.findMany({where:{tenantId},select:{id:true,invoiceId:true,reference:true,amountMinor:true,currency:true,state:true,createdAt:true},take:50,orderBy:{createdAt:'desc'}}),
  ]);
  return {tenant,subscription:subscription?{...subscription,effectiveState:effectiveState(subscription)}:null,invoices,payments};
 }
 async activate(actorId:string,tenantId:string,input:Activate){
  return this.db.$transaction(async tx=>{
   const current=await tx.subscription.findUnique({where:{tenantId}});
   if(!current)throw new NotFoundException('Subscription not found');
   const plan=await tx.plan.findUnique({where:{code:input.planCode}});
   if(!plan||!plan.enabled||plan.code==='trial')throw new BadRequestException('Plan not enabled for activation');
   const amount=input.cycle==='MONTHLY'?plan.monthlyPriceMinor:plan.yearlyPriceMinor;
   if(amount===null)throw new BadRequestException('Plan price has not been configured');
   const now=new Date();
   const isRenewal=current.planId===plan.id&&current.cycle===input.cycle&&current.state==='ACTIVE'&&current.periodEnd>now;
   const periodStart=isRenewal?current.periodEnd:now;
   const periodEnd=futureDate(periodStart,input.cycle);
   const subscription=await tx.subscription.update({where:{tenantId},data:{
    planId:plan.id,state:'ACTIVE',cycle:input.cycle,periodStart,periodEnd,trialEndsAt:null,
    graceEndsAt:null,cancelledAt:null,suspendedAt:null,...snapshot(plan),
   }});
   await this.record(tx,actorId,tenantId,'subscription.activate',{plan:plan.code,cycle:input.cycle,manualOverride:true});
   return {subscription:{id:subscription.id,state:effectiveState(subscription),periodEnd:subscription.periodEnd,planCode:plan.code}};
  },{isolationLevel:'Serializable'});
 }
 async extendTrial(actorId:string,tenantId:string,days:number){
  return this.db.$transaction(async tx=>{
   const s=await tx.subscription.findUnique({where:{tenantId}});
   if(!s)throw new NotFoundException('Subscription not found');
   if(s.state!=='TRIALING')throw new ConflictException('Only trial subscriptions can be extended');
   const from=s.periodEnd>new Date()?s.periodEnd:new Date();
   const end=new Date(from.getTime()+days*86400000);
   const subscription=await tx.subscription.update({where:{tenantId},data:{periodEnd:end,trialEndsAt:end}});
   await this.record(tx,actorId,tenantId,'trial.extend',{days});
   return {state:effectiveState(subscription),trialEndsAt:subscription.trialEndsAt};
  });
 }
 async suspend(actorId:string,tenantId:string){
  return this.db.$transaction(async tx=>{
   const sub=await tx.subscription.findUnique({where:{tenantId}});
   if(!sub)throw new NotFoundException('Subscription not found');
   const s=await tx.subscription.update({where:{tenantId},data:{state:'SUSPENDED',suspendedAt:new Date()}});
   await this.record(tx,actorId,tenantId,'subscription.suspend',{previous:sub.state});
   return {state:effectiveState(s)};
  });
 }
 async resume(actorId:string,tenantId:string){
  return this.db.$transaction(async tx=>{
   const sub=await tx.subscription.findUnique({where:{tenantId}});
   if(!sub)throw new NotFoundException('Subscription not found');
   if(sub.state!=='SUSPENDED')throw new ConflictException('Subscription not suspended');
   const now=new Date();
   const target=sub.trialEndsAt&&sub.trialEndsAt>now?'TRIALING':
    sub.graceEndsAt&&sub.graceEndsAt>now?'GRACE':
    sub.periodEnd>now?'ACTIVE':null;
   if(!target)throw new ConflictException('Subscription expired; administrator must renew or extend it');
   const updated=await tx.subscription.update({where:{tenantId},data:{state:target,suspendedAt:null}});
   await this.record(tx,actorId,tenantId,'subscription.resume',{state:target});
   return {state:effectiveState(updated)};
  });
 }
 async grantGrace(actorId:string,tenantId:string,days:number){
  return this.db.$transaction(async tx=>{
   const s=await tx.subscription.findUnique({where:{tenantId}});
   if(!s)throw new NotFoundException('Subscription not found');
   if(s.state==='SUSPENDED'||s.state==='CANCELLED')throw new ConflictException('Cannot grant grace to suspended or cancelled subscription');
   const from=s.periodEnd>new Date()?s.periodEnd:new Date();
   const graceEndsAt=new Date(from.getTime()+days*86400000);
   const changed=await tx.subscription.update({where:{tenantId},data:{state:'GRACE',graceEndsAt}});
   await this.record(tx,actorId,tenantId,'subscription.grace',{days});
   return {state:effectiveState(changed),graceEndsAt};
  });
 }
 async createInvoice(actorId:string,input:InvoiceInput){
  return this.db.$transaction(async tx=>{
   const tenant=await tx.tenant.findUnique({where:{id:input.tenantId},select:{id:true}});
   if(!tenant)throw new NotFoundException('Tenant not found');
   const plan=input.planCode?await tx.plan.findUnique({where:{code:input.planCode}}):null;
   if(input.planCode&&!plan)throw new BadRequestException('Unknown plan code');
   const invoice=await tx.invoice.create({data:{
    number:'INV-'+new Date().toISOString().slice(0,7).replace('-','')+'-'+randomBytes(7).toString('hex').toUpperCase(),
    tenantId:input.tenantId,planId:plan?.id,amountMinor:input.amountMinor,currency:input.currency,
    dueAt:input.dueAt?new Date(input.dueAt):null,
   }});
   await this.record(tx,actorId,input.tenantId,'invoice.issue',{invoice:invoice.number,amountMinor:invoice.amountMinor,currency:invoice.currency});
   return {invoice};
  });
 }
 async recordPayment(actorId:string,input:PaymentInput){
  return this.db.$transaction(async tx=>{
   const invoice=await tx.invoice.findUnique({where:{id:input.invoiceId}});
   if(!invoice||invoice.status!=='ISSUED')throw new ConflictException('No unpaid invoice found');
   const pending=await tx.paymentRecord.findFirst({where:{invoiceId:invoice.id,state:'PENDING'}});
   if(pending)throw new ConflictException('An unverified payment already exists for this invoice');
   const subscription=await tx.subscription.findUnique({where:{tenantId:invoice.tenantId}});
   try{
    const payment=await tx.paymentRecord.create({data:{
      tenantId:invoice.tenantId,invoiceId:invoice.id,subscriptionId:subscription?.id,
      createdById:actorId,amountMinor:invoice.amountMinor,currency:invoice.currency,
      reference:input.reference,note:input.note,
    }});
    await this.record(tx,actorId,invoice.tenantId,'payment.record',{payment:payment.id,reference:payment.reference});
    return {payment};
   }catch(e){
    if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002')throw new ConflictException('Payment reference already recorded');
    throw e;
   }
  });
 }
 async decidePayment(actorId:string,paymentId:string,decision:'VERIFY'|'REJECT'){
  return this.db.$transaction(async tx=>{
   const payment=await tx.paymentRecord.findUnique({where:{id:paymentId}});
   if(!payment)throw new NotFoundException('Payment not found');
   if(payment.state!=='PENDING')throw new ConflictException('Payment already reviewed');
   if(decision==='VERIFY'){
    const invoice=payment.invoiceId?await tx.invoice.findUnique({where:{id:payment.invoiceId}}):null;
    if(!invoice||invoice.status!=='ISSUED'||invoice.tenantId!==payment.tenantId||invoice.amountMinor!==payment.amountMinor||invoice.currency!==payment.currency){
      throw new ConflictException('Invoice no longer matches this payment');
    }
    const paid=await tx.invoice.updateMany({where:{id:invoice.id,status:'ISSUED'},data:{status:'PAID',paidAt:new Date()}});
    if(paid.count!==1)throw new ConflictException('Invoice already paid');
   }
   const updated=await tx.paymentRecord.update({where:{id:payment.id},data:{
     state:decision==='VERIFY'?'VERIFIED':'REJECTED',verifiedAt:decision==='VERIFY'?new Date():null,
   }});
   await this.record(tx,actorId,payment.tenantId,decision==='VERIFY'?'payment.verify':'payment.reject',{payment:paymentId});
   return {payment:updated};
  },{isolationLevel:'Serializable'});
 }
}
