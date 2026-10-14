import {ConflictException,Injectable,NotFoundException,ServiceUnavailableException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import type {z} from 'zod';
import type {createAccount,updateAccount,requestTest,heartbeat,testResult} from './connector-lab.dto';

const TEST_URL='https://example.org/';
const OFFLINE_AFTER_MS=75_000;
const JOB_TIMEOUT_MS=150_000;
const readOnlyNotice='Experimental read-only browser tests only. No Meta/X login, cookies, publishing or challenge bypass.';
@Injectable()
export class ConnectorLabService {
 constructor(private readonly db:PrismaService){}
 private bridgeEnabled():boolean{
  return process.env.BROWSER_LAB_CONTROL_ENABLED==='true' &&
   /^[a-fA-F0-9]{64,128}$/.test(process.env.BROWSER_LAB_AGENT_TOKEN||'');
 }
 async overview(){
  const [runtime,accounts,jobs]=await Promise.all([
   this.db.browserLabRuntime.findUnique({where:{id:'primary'}}),
   this.db.browserLabAccount.findMany({orderBy:{createdAt:'asc'},take:100,
     select:{id:true,accountKey:true,proxyKey:true,createdAt:true,updatedAt:true}}),
   this.db.browserLabJob.findMany({orderBy:{createdAt:'desc'},take:30,
     select:{id:true,driver:true,state:true,title:true,failureCode:true,createdAt:true,startedAt:true,finishedAt:true,
       account:{select:{accountKey:true}}}}),
  ]);
  const configured=this.bridgeEnabled();
  const online=configured&&!!runtime?.lastSeenAt&&Date.now()-runtime.lastSeenAt.getTime()<OFFLINE_AFTER_MS &&
   runtime.maxSessions===1&&runtime.workerMode==='read_only';
  return {
   configured,online,maxSessions:1,availableDrivers:['playwright','patchright'],
   testOrigin:TEST_URL,liveSocialConnectionsEnabled:false,publishingEnabled:false,
   agent:{lastSeenAt:runtime?.lastSeenAt||null,agentVersion:runtime?.agentVersion||null,
    reportedSessions:runtime?.maxSessions||null,workerMode:runtime?.workerMode||null},
   proxyKeys:online?(runtime?.proxyKeys||[]):[],
   accounts:accounts.map(a=>({...a,proxyAvailable:!a.proxyKey || (online&&runtime!.proxyKeys.includes(a.proxyKey))})),
   jobs,notice:readOnlyNotice,
  };
 }
 async register(actorId:string,input:z.infer<typeof createAccount>){
  const account=await this.db.$transaction(async tx=>{
   const x=await tx.browserLabAccount.create({data:{accountKey:input.accountKey,proxyKey:input.proxyKey||null},
    select:{id:true,accountKey:true,proxyKey:true}});
   await tx.platformAuditEvent.create({data:{actorId,action:'connector_lab.account.create',
    resourceType:'browser_lab_account',resourceId:x.id,details:{accountKey:x.accountKey,proxyAssigned:!!x.proxyKey}}});
   return x;
  });
  return {account,notice:'Test label saved. This is not a connected social-media account.'};
 }
 async update(actorId:string,id:string,input:z.infer<typeof updateAccount>){
  return this.db.$transaction(async tx=>{
   const changed=await tx.browserLabAccount.updateMany({where:{id},data:{proxyKey:input.proxyKey}});
   if(!changed.count)throw new NotFoundException('Test account not found');
   await tx.platformAuditEvent.create({data:{actorId,action:'connector_lab.proxy.assign',
    resourceType:'browser_lab_account',resourceId:id,details:{proxyAssigned:!!input.proxyKey}}});
   return {saved:true,notice:'Proxy alias assigned. Proxy address and credentials stay in the operator-owned VPS file.'};
  });
 }
 async enqueue(actorId:string,input:z.infer<typeof requestTest>){
  if(!this.bridgeEnabled())throw new ServiceUnavailableException('Connector lab bridge not configured');
  return this.db.$transaction(async tx=>{
   const runtime=await tx.browserLabRuntime.findUnique({where:{id:'primary'}});
   if(!runtime?.lastSeenAt||Date.now()-runtime.lastSeenAt.getTime()>=OFFLINE_AFTER_MS||
     runtime.maxSessions!==1||runtime.workerMode!=='read_only')
    throw new ServiceUnavailableException('Browser lab worker offline');
   const account=await tx.browserLabAccount.findUnique({where:{id:input.accountId}});
   if(!account)throw new NotFoundException('Test label not found');
   if(account.proxyKey&&!runtime.proxyKeys.includes(account.proxyKey))
    throw new ConflictException('Proxy alias not available on worker; configure operator-owned proxy file first');
   // No automatic retry of in-flight tests. Reap lost workers as FAILED before admitting another.
   await tx.browserLabJob.updateMany({where:{state:'RUNNING',startedAt:{lt:new Date(Date.now()-JOB_TIMEOUT_MS)}},
    data:{state:'FAILED',failureCode:'worker_timeout',finishedAt:new Date()}});
   const existing=await tx.browserLabJob.count({where:{state:{in:['QUEUED','RUNNING']}}});
   if(existing)throw new ConflictException('Only one test may be queued or running at a time');
   const job=await tx.browserLabJob.create({data:{accountId:account.id,driver:input.driver,actorId},
    select:{id:true,state:true}});
   await tx.platformAuditEvent.create({data:{actorId,action:'connector_lab.test.queued',
    resourceType:'browser_lab_job',resourceId:job.id,details:{driver:input.driver,accountKey:account.accountKey}}});
   return {job,notice:readOnlyNotice};
  },{isolationLevel:'Serializable'});
 }
 async heartbeat(input:z.infer<typeof heartbeat>){
  const runtime=await this.db.browserLabRuntime.upsert({where:{id:'primary'},
   create:{id:'primary',maxSessions:1,workerMode:'read_only',agentVersion:input.agentVersion,
    proxyKeys:[...new Set(input.proxyKeys)],lastSeenAt:new Date()},
   update:{maxSessions:1,workerMode:'read_only',agentVersion:input.agentVersion,
    proxyKeys:[...new Set(input.proxyKeys)],lastSeenAt:new Date()},
   select:{lastSeenAt:true}});
  return {ok:true,serverTime:runtime.lastSeenAt};
 }
 async claim(){
  // Claim exactly one. Never return arbitrary URLs, platform tokens or proxy credentials.
  const pending=await this.db.browserLabJob.findFirst({where:{state:'QUEUED'},
   orderBy:{createdAt:'asc'},include:{account:true}});
  if(!pending)return {job:null};
  const updated=await this.db.browserLabJob.updateMany({where:{id:pending.id,state:'QUEUED'},
   data:{state:'RUNNING',startedAt:new Date()}});
  if(!updated.count)return {job:null};
  return {job:{id:pending.id,accountKey:pending.account.accountKey,proxyKey:pending.account.proxyKey,
   driver:pending.driver,targetUrl:TEST_URL}};
 }
 async finish(input:z.infer<typeof testResult>){
  const result=await this.db.browserLabJob.updateMany({where:{id:input.jobId,state:'RUNNING'},
   data:{state:input.state,finishedAt:new Date(),
    title:input.state==='SUCCEEDED'?input.title?.slice(0,160)||null:null,
    failureCode:input.state==='FAILED'?input.failureCode||'test_failed':null}});
  if(result.count!==1)throw new ConflictException('Test already finalized, expired or not claimed');
  return {ok:true};
 }
}
