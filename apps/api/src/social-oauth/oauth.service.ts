import {
  BadRequestException,ConflictException,ForbiddenException,Injectable,NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {EntitlementsService} from '../billing/entitlements.service';
import {randomUrlToken,tokenHash,seal,unseal} from './oauth-crypto';
import {authorizeUrl,exchangeCode,hasOAuthConfig,type OAuthNetwork,type PendingAccount} from './provider-transport';
import type {Prisma} from '@prisma/client';
import {inspectMetaAccount,refreshMetaAccount,MetaAccessError,metaScopeHealth,type MetaAccount} from './meta-account';
type ConnectNetwork='meta'|'x';
type Vault={accounts:PendingAccount[]};
@Injectable()
export class OAuthService{
 constructor(private readonly db:PrismaService,private readonly entitlement:EntitlementsService){}
 private async manager(userId:string,brandId:string){
  const brand=await this.db.brand.findUnique({where:{id:brandId},select:{
    id:true,archivedAt:true,workspace:{select:{id:true,tenantId:true}}}});
  if(!brand||brand.archivedAt)throw new NotFoundException('Brand unavailable');
  const member=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId:brand.workspace.tenantId,userId}},
   select:{role:true}});
  if(!member)throw new NotFoundException('Brand unavailable');
  if(!['OWNER','ADMIN'].includes(member.role))throw new ForbiddenException('Organization manager access required');
  return {brand,tenantId:brand.workspace.tenantId};
 }
 private async activePolicy(network:ConnectNetwork){
  const ids=network==='meta'?['facebook','instagram']:['x'];
  const policies=await this.db.socialProviderPolicy.findMany({where:{network:{in:ids}}});
  const enabled=policies.some(p=>p.rolloutState==='TESTING'&&p.operatorEnabled);
  if(!enabled)throw new ServiceUnavailableException('Provider not enabled for controlled OAuth testing');
  if(network==='x'&&(!policies.some(p=>p.network==='x'&&p.costApproved)||
    process.env.X_API_BUDGET_APPROVED!=='true'||Number(process.env.X_API_MAX_MONTHLY_USD_MINOR||0)<=0)){
   throw new ServiceUnavailableException('X paid API budget has not been explicitly authorized');
  }
  if(process.env[(network==='meta'?'META':'X')+'_CONNECT_ENABLED']!=='true'||!hasOAuthConfig(network)){
    throw new ServiceUnavailableException('Provider OAuth credentials and operator flag not configured');
  }
  if(!process.env.SOCIAL_TOKEN_ENCRYPTION_KEY)throw new ServiceUnavailableException('Social token encryption not configured');
 }
 async readiness(userId:string,tenantId:string,workspaceId:string,brandId:string){
  const {brand,tenantId:owned}=await this.manager(userId,brandId);
  if(tenantId!==owned||brand.workspace.id!==workspaceId)throw new NotFoundException('Brand unavailable');
  const [policies,accounts]=await Promise.all([
   this.db.socialProviderPolicy.findMany({where:{network:{in:['facebook','instagram','x']}},select:{
    network:true,rolloutState:true,operatorEnabled:true,apiApproved:true,costApproved:true,productionVerified:true,
   }}),
   this.db.socialConnection.findMany({where:{brandId,platform:{in:['facebook','instagram','x']}},select:{
    id:true,platform:true,externalAccountId:true,externalAccountName:true,state:true,tokenExpiresAt:true,
    connectedAt:true,tokenScopes:true,lastHealthCheckedAt:true,lastHealthReason:true,
   },orderBy:{createdAt:'desc'}}),
  ]);
  return {providers:['meta','x'].map(network=>({
    network,
    configured:hasOAuthConfig(network as ConnectNetwork)&&Boolean(process.env.SOCIAL_TOKEN_ENCRYPTION_KEY)&&
      process.env[(network==='meta'?'META':'X')+'_CONNECT_ENABLED']==='true',
    testingEnabled:policies.some(p=>(network==='meta'?['facebook','instagram']:['x']).includes(p.network)&&p.operatorEnabled&&p.rolloutState==='TESTING'),
    paidApiConsent:network==='x'?process.env.X_API_BUDGET_APPROVED==='true'&&policies.some(p=>p.network==='x'&&p.costApproved):null,
    canPublish:false,
   })),accounts,notice:'Account linking for approved tests only. No publish calls are available.'};
 }
 async start(userId:string,sessionId:string,tenantId:string,workspaceId:string,brandId:string,network:ConnectNetwork){
  const {brand,tenantId:owned}=await this.manager(userId,brandId);
  if(tenantId!==owned||brand.workspace.id!==workspaceId)throw new NotFoundException('Brand unavailable');
  await this.activePolicy(network);
  // Expired trials and suspended subscriptions cannot establish new connections.
  return this.entitlement.inTransaction(tenantId,async(tx)=>{
   const session=await tx.session.findUnique({where:{id:sessionId},select:{userId:true,revokedAt:true,expiresAt:true}});
   if(!session||session.userId!==userId||session.revokedAt||session.expiresAt<=new Date())throw new ForbiddenException('Session no longer valid');
   const state=randomUrlToken();
   const verifier=network==='x'?randomUrlToken(48):undefined;
   const url=authorizeUrl(network,state,verifier);
   // Opportunistically clear expired pending encrypted credentials and stale OAuth states.
   await tx.socialOAuthAttempt.deleteMany({where:{expiresAt:{lt:new Date()}}});
   await tx.socialOAuthAttempt.create({data:{
    stateHash:tokenHash(state),brandId,sessionId,userId,network,
    verifierCipher:verifier?seal({verifier}):null,expiresAt:new Date(Date.now()+10*60*1000),
   }});
   return {authorizationUrl:url,network,expiresInSeconds:600,warning:'Not a publishing authorization. The provider may apply review or charges.'};
  });
 }
 private async existingAttempt(userId:string,sessionId:string,id:string){
  const attempt=await this.db.socialOAuthAttempt.findUnique({where:{id}});
  if(!attempt||attempt.userId!==userId||attempt.sessionId!==sessionId||
   attempt.expiresAt<=new Date()||attempt.selectedAt)throw new NotFoundException('Connection attempt expired');
  return attempt;
 }
 async callback(userId:string,sessionId:string,network:string,code:string,state:string){
  if(network!=='meta'&&network!=='x')throw new NotFoundException('Unknown OAuth provider');
  if(!/^[A-Za-z0-9_-]{30,150}$/.test(state)||code.length<5||code.length>4096){
    throw new BadRequestException('Invalid OAuth response');
  }
  const found=await this.db.socialOAuthAttempt.findUnique({where:{stateHash:tokenHash(state)}});
  if(!found||found.userId!==userId||found.sessionId!==sessionId||found.network!==network||
    found.expiresAt<=new Date()||found.stateUsedAt){
   throw new ForbiddenException('OAuth state invalid or already used');
  }
  await this.manager(userId,found.brandId);
  await this.activePolicy(network);
  // Consume state atomically BEFORE network calls. Any failed exchange requires starting over.
  const updated=await this.db.socialOAuthAttempt.updateMany({where:{
    id:found.id,stateUsedAt:null,expiresAt:{gt:new Date()},sessionId,
  },data:{stateUsedAt:new Date()}});
  if(updated.count!==1)throw new ForbiddenException('OAuth state already used');
  const verifier=found.verifierCipher?unseal<{verifier:string}>(found.verifierCipher).verifier:undefined;
  const accounts=await exchangeCode(network,code,verifier);
  if(!accounts.accounts.length)throw new NotFoundException('No supported account was returned');
  await this.db.socialOAuthAttempt.update({where:{id:found.id},data:{
    pendingCipher:seal(accounts),verifierCipher:null,
  }});
  return {attemptId:found.id};
 }
 async accounts(userId:string,sessionId:string,id:string){
  const attempt=await this.existingAttempt(userId,sessionId,id);
  await this.manager(userId,attempt.brandId);
  if(!attempt.stateUsedAt||!attempt.pendingCipher)throw new ConflictException('Connection authorization incomplete');
  const vault=unseal<Vault>(attempt.pendingCipher);
  return {brandId:attempt.brandId,accounts:vault.accounts.map(a=>({id:a.id,platform:a.platform,name:a.name})),
   expiresAt:attempt.expiresAt,notice:'Choose an account. No content can be published yet.'};
 }
 async choose(userId:string,sessionId:string,id:string,accountId:string,platform:'facebook'|'instagram'|'x'){
  const attempt=await this.existingAttempt(userId,sessionId,id);
  const {tenantId}=await this.manager(userId,attempt.brandId);
  await this.activePolicy(attempt.network as ConnectNetwork);
  if(!attempt.stateUsedAt||!attempt.pendingCipher)throw new ConflictException('Authorization incomplete');
  const vault=unseal<Vault>(attempt.pendingCipher);
  const account=vault.accounts.find(a=>a.id===accountId&&a.platform===platform);
  if(!account||((attempt.network==='meta')!==(platform!=='x'))){
   throw new BadRequestException('Account not present in authorized response');
  }
  const selectedPolicy=await this.db.socialProviderPolicy.findUnique({where:{network:platform}});
  if(!selectedPolicy||selectedPolicy.rolloutState!=='TESTING'||!selectedPolicy.operatorEnabled){
   throw new ServiceUnavailableException('This exact social account platform is not enabled for authorized testing');
  }
  return this.entitlement.inTransaction(tenantId,async(tx)=>{
   const count=await tx.socialOAuthAttempt.updateMany({where:{
     id:attempt.id,selectedAt:null,pendingCipher:{not:null},expiresAt:{gt:new Date()},sessionId,
   },data:{selectedAt:new Date(),pendingCipher:null}});
   if(count.count!==1)throw new ConflictException('Account selection already completed');
   const existing=await tx.socialConnection.findUnique({where:{
     brandId_platform_externalAccountId:{brandId:attempt.brandId,platform,externalAccountId:account.id},
   }});
   if(!existing||!['CONNECTED','LIMITED'].includes(existing.state)){
    const sub=await tx.subscription.findUniqueOrThrow({where:{tenantId}});
    await this.entitlement.assertCount(tx,sub,'CONNECTIONS',1);
   }
   const initialHealth=platform==='x'?null:metaScopeHealth(platform,account.scopes,Boolean(account.userAccessToken));
   const data={
    mode:'OFFICIAL' as const,state:initialHealth?.state??'CONNECTED' as const,externalAccountName:account.name,
    encryptedCredentials:seal({accessToken:account.accessToken,refreshToken:account.refreshToken,userAccessToken:account.userAccessToken}),
    tokenExpiresAt:account.expiresAt?new Date(account.expiresAt):null,
    tokenScopes:account.scopes,connectedAt:new Date(),
    lastHealthCheckedAt:initialHealth?new Date():null,
    lastHealthReason:initialHealth?.reason??null,
   };
   const linked=await tx.socialConnection.upsert({where:{
     brandId_platform_externalAccountId:{brandId:attempt.brandId,platform,externalAccountId:account.id},
   },create:{brandId:attempt.brandId,platform,externalAccountId:account.id,...data},update:data});
   await tx.platformAuditEvent.create({data:{
     actorId:userId,action:'social.connect',resourceType:'social_connection',resourceId:linked.id,
     details:{platform,brandId:attempt.brandId,accountId:account.id},
   }});
   return {account:{id:linked.id,platform,name:linked.externalAccountName,state:linked.state},
    canPublish:false,notice:initialHealth?.missingScopes.length?'Linked with limited permissions. Grant required Meta scopes before publishing.':'Linked for a controlled test. Publishing is not enabled.'};
  });
 }
 private async metaRecord(userId:string,tenantId:string,workspaceId:string,brandId:string,connectionId:string){
  const {brand,tenantId:owned}=await this.manager(userId,brandId);
  if(tenantId!==owned||brand.workspace.id!==workspaceId)throw new NotFoundException('Brand unavailable');
  const record=await this.db.socialConnection.findFirst({where:{id:connectionId,brandId}});
  if(!record||!['facebook','instagram'].includes(record.platform)||record.mode!=='OFFICIAL')
    throw new NotFoundException('Meta account unavailable');
  if(!record.encryptedCredentials||!record.externalAccountId||record.state==='DISCONNECTED')
    throw new ConflictException('Connect the Meta account again');
  return record;
 }
 /** Operator-authorized, per-account read-only check; never publishes or returns tokens. */
 async checkAccount(userId:string,tenantId:string,workspaceId:string,brandId:string,id:string){
  const row=await this.metaRecord(userId,tenantId,workspaceId,brandId,id);
  if(process.env.META_CONNECT_ENABLED!=='true')throw new ServiceUnavailableException('Meta connector disabled');
  let health;
  try{
   const credentials=unseal<MetaAccount['credentials']>(row.encryptedCredentials!);
   health=await inspectMetaAccount({platform:row.platform as 'facebook'|'instagram',
    externalAccountId:row.externalAccountId!,credentials,expiresAt:row.tokenExpiresAt});
  }catch(err){
   if(!(err instanceof MetaAccessError))throw err;
   if(err.kind!=='restricted')throw new ServiceUnavailableException('Meta health check temporarily unavailable');
   health=metaScopeHealth(row.platform as 'facebook'|'instagram',[],false);
  }
  const updated=await this.db.socialConnection.updateMany({where:{id,brandId,state:{not:'DISCONNECTED'},
   encryptedCredentials:{not:null}},data:{state:health.state,tokenScopes:health.grantedScopes,
    lastHealthCheckedAt:new Date(),lastHealthReason:health.reason,
    pausedAt:health.state==='CONNECTED'?null:new Date()}});
  if(!updated.count)throw new ConflictException('Account changed during health check');
  return {state:health.state,reason:health.reason,missingScopes:health.missingScopes,
   lastCheckedAt:new Date().toISOString(),canPublish:false};
 }
 /** User-initiated refresh; locks identity to the exact previously-authorized Page/IG account. */
 async refreshAccount(userId:string,tenantId:string,workspaceId:string,brandId:string,id:string){
  const row=await this.metaRecord(userId,tenantId,workspaceId,brandId,id);
  if(process.env.META_CONNECT_ENABLED!=='true')throw new ServiceUnavailableException('Meta connector disabled');
  await this.activePolicy('meta');
  let refreshed;
  try{
   refreshed=await refreshMetaAccount({platform:row.platform as 'facebook'|'instagram',
    externalAccountId:row.externalAccountId!,
    credentials:unseal<MetaAccount['credentials']>(row.encryptedCredentials!),
    expiresAt:row.tokenExpiresAt});
  }catch(err){
   if(err instanceof MetaAccessError)throw new ConflictException('Meta authorization must be renewed or provider unavailable');
   throw err;
  }
  const changed=await this.db.socialConnection.updateMany({where:{id,brandId,
   encryptedCredentials:row.encryptedCredentials,state:{not:'DISCONNECTED'}},data:{
   encryptedCredentials:seal(refreshed.credentials),tokenExpiresAt:refreshed.expiresAt,
   tokenScopes:refreshed.health.grantedScopes,state:refreshed.health.state,
   lastHealthCheckedAt:new Date(),lastHealthReason:refreshed.health.reason,
   pausedAt:refreshed.health.state==='CONNECTED'?null:new Date(),
  }});
  if(!changed.count)throw new ConflictException('Account changed during refresh, retry');
  await this.db.platformAuditEvent.create({data:{actorId:userId,action:'social.meta.refresh',
   resourceType:'social_connection',resourceId:id,details:{brandId,state:refreshed.health.state}}});
  return {refreshed:true,state:refreshed.health.state,missingScopes:refreshed.health.missingScopes,canPublish:false};
 }
 async disconnect(userId:string,tenantId:string,workspaceId:string,brandId:string,connectionId:string){
  const {brand,tenantId:owned}=await this.manager(userId,brandId);
  if(tenantId!==owned||brand.workspace.id!==workspaceId)throw new NotFoundException('Brand unavailable');
  return this.db.$transaction(async tx=>{
   const connection=await tx.socialConnection.findFirst({where:{id:connectionId,brandId}});
   if(!connection)throw new NotFoundException('Account not found');
   await tx.socialConnection.update({where:{id:connectionId},data:{
     state:'DISCONNECTED',encryptedCredentials:null,tokenExpiresAt:null,tokenScopes:[],
    lastHealthReason:null,lastHealthCheckedAt:null,
   }});
   await tx.platformAuditEvent.create({data:{actorId:userId,action:'social.disconnect',
    resourceType:'social_connection',resourceId:connectionId,
    details:{platform:connection.platform,brandId}}});
   return {disconnected:true,providerRevocation:'You may also revoke this app in your social account settings'};
  });
 }
 dashboardRedirect(result:{attemptId:string}|{failure:string}){
  const base=process.env.WEB_BASE_URL||'http://localhost:3000';
  const url=new URL('/dashboard',base);
  if(url.origin!==new URL(base).origin)throw new Error('Invalid WEB_BASE_URL');
  if('attemptId'in result)url.searchParams.set('socialAttempt',result.attemptId);
  else url.searchParams.set('socialConnectError',result.failure);
  return url.toString();
 }
}
