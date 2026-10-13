import {Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
export type PreflightNetwork='facebook'|'instagram'|'x';
export type PreflightCheck={code:string;ok:boolean;reason:string};
@Injectable()
export class PreflightService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async evaluate(t:string,w:string,b:string,userId:string,postId:string,network:PreflightNetwork,connectionId?:string){
  await this.access.brand(t,w,b,userId);
  const [brand,post,policy,connection,subscription,globalPause]=await Promise.all([
   this.db.brand.findUniqueOrThrow({where:{id:b},select:{archivedAt:true,publishingPaused:true}}),
   this.db.contentPost.findFirst({where:{id:postId,brandId:b},include:{versions:{orderBy:{number:'desc'},take:1,include:{approvals:true}}}}),
   this.db.socialProviderPolicy.findUnique({where:{network}}),
   connectionId?this.db.socialConnection.findFirst({where:{id:connectionId,brandId:b,platform:network},
     select:{id:true,state:true,mode:true,tokenScopes:true,tokenExpiresAt:true,pausedAt:true}}):Promise.resolve(null),
   this.db.subscription.findUnique({where:{tenantId:t},select:{state:true,periodEnd:true,graceEndsAt:true}}),
   this.db.platformSetting.findUnique({where:{key:'global_social_pause'}}),
  ]);
  if(!post)throw new NotFoundException('Post not found');
  const v=post.versions[0];
  const scoped=network==='instagram'?['instagram_basic','instagram_content_publish']:
   network==='facebook'?['pages_manage_posts','pages_read_engagement']:['tweet.write','users.read'];
  const now=new Date();
  const validSubscription=Boolean(subscription&&['ACTIVE','TRIALING','GRACE'].includes(subscription.state)&&
    (subscription.state==='GRACE'?Boolean(subscription.graceEndsAt&&subscription.graceEndsAt>now):subscription.periodEnd>now));
  const approval=v?.approvals.some(a=>a.state==='APPROVED'&&Boolean(a.approvedAt)&&
   a.expiresAt>now&&Boolean(a.reviewedById)&&a.requestedById!==a.reviewedById)??false;
  const checks:PreflightCheck[]=[
   {code:'brand_enabled',ok:!brand.archivedAt&&!brand.publishingPaused,reason:'Brand must be active and explicitly unpaused'},
   {code:'global_pause_off',ok:globalPause?.value===false,reason:'Global social publishing pause must be cleared by platform operator'},
   {code:'subscription',ok:validSubscription,reason:'Active subscription period required'},
   {code:'content_approved',ok:post.state==='APPROVED'&&approval,reason:'Latest immutable content version requires independent unexpired approval'},
   {code:'provider_approved',ok:Boolean(policy?.apiApproved&&policy?.productionVerified&&policy.rolloutState==='PRODUCTION_READY'&&policy.operatorEnabled),
    reason:'Verified official provider permission and production rollout required'},
   {code:'account_connected',ok:Boolean(connection&&connection.state==='CONNECTED'&&connection.mode==='OFFICIAL'&&!connection.pausedAt),
    reason:'Eligible official connection required'},
   {code:'token_not_expired',ok:Boolean(connection?.tokenExpiresAt&&connection.tokenExpiresAt>now),reason:'Fresh validated access token required'},
   {code:'verified_scopes',ok:Boolean(connection&&scoped.every(s=>connection.tokenScopes.includes(s))),reason:'Provider-granted scopes must be verified, not inferred from requested scopes'},
   {code:'live_worker_available',ok:false,reason:'No production publishing worker is released; no action can be sent'},
  ];
  return {network,postId,latestVersion:v?.number??null,connectionId:connection?.id??null,
   canPublish:false,checks,approvalEvidence:approval,manualFallback:true,
   note:'Diagnostic only. This endpoint cannot authorize live posting or move content to PUBLISHED.'};
 }
}
