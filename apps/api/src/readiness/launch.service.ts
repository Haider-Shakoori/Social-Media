import {Injectable} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
type Gate={key:string;status:'BLOCKED'|'REVIEW_REQUIRED'|'PASS';detail:string};
@Injectable()
export class LaunchService{
 constructor(private readonly db:PrismaService){}
 async report(){
  const [policies,connected,paused,active,approvals]=await Promise.all([
   this.db.socialProviderPolicy.findMany({where:{network:{in:['facebook','instagram','x']}},select:{
    network:true,apiApproved:true,productionVerified:true,operatorEnabled:true,rolloutState:true,costApproved:true}}),
   this.db.socialConnection.count({where:{state:'CONNECTED',platform:{in:['facebook','instagram','x']}}}),
   this.db.brand.count({where:{publishingPaused:true,archivedAt:null}}),
   this.db.subscription.count({where:{state:{in:['TRIALING','ACTIVE','GRACE']}}}),
   this.db.approvalRequest.count({where:{state:'PENDING'}}),
  ]);
  const gates:Gate[]=[
   {key:'social_automatic_publishing',status:'BLOCKED',detail:'Publish worker deliberately rejects all network post calls'},
   {key:'meta_provider_authorization',status:policies.some(p=>['facebook','instagram'].includes(p.network)&&p.apiApproved&&p.productionVerified)?'REVIEW_REQUIRED':'BLOCKED',
    detail:'Real developer-app review and eligible account tests required'},
   {key:'x_paid_api_budget',status:policies.some(p=>p.network==='x'&&p.costApproved&&p.productionVerified)?'REVIEW_REQUIRED':'BLOCKED',
    detail:'No metered request ledger tied to live X API calls'},
   {key:'token_refresh_remote_revocation',status:'BLOCKED',detail:'Provider refresh and server-side revoke not implemented'},
   {key:'webhook_signature_validation',status:'BLOCKED',detail:'External provider webhooks not connected'},
   {key:'privacy_and_legal',status:'REVIEW_REQUIRED',detail:'Privacy policy and launch terms require independent legal review'},
   {key:'ai_generation',status:process.env.AI_GENERATION_ENABLED==='true'?'REVIEW_REQUIRED':'BLOCKED',
    detail:'Cloudflare credential limits, billing and abuse review required'},
   {key:'external_analytics',status:'BLOCKED',detail:'External Meta/X insights are unavailable'},
   {key:'manual_calendar',status:process.env.MANUAL_REMINDER_SCHEDULER_ENABLED==='true'?'PASS':'REVIEW_REQUIRED',
    detail:'Reminders do not post content to social platforms'},
  ];
  return {productionReady:false,environment:process.env.NODE_ENV||'unspecified',
   pilot:['facebook','instagram','x'], deferredPlatforms:7,checks:gates,
   counts:{connectedAccounts:connected,pausedBrands:paused,subscriptionRecords:active,pendingHumanApprovals:approvals},
   notice:'A passing CI run does not satisfy provider certification or turn on publishing.'};
 }
}
