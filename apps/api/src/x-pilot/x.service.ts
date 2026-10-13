import {Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import {PreflightService} from '../preflight/preflight.service';
export function conservativeXDraftCheck(caption:string,mediaUrls:readonly string[]){
 const count=[...caption].length;
 const hasUrl=/https?:\/\/\S+/i.test(caption);
 return {characterCount:count,characterLimitUsed:280,withinConservativeLimit:count<=280,
   containsUrl:hasUrl,mediaCount:mediaUrls.length,
   supportedByCurrentPilot:count>0&&count<=280&&!hasUrl&&mediaUrls.length===0,
   note:'Conservative local text-only validation, not an authoritative X character counter or provider posting authorization.'};
}
@Injectable()
export class XPilotService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService,private readonly preflight:PreflightService){}
 async preview(t:string,w:string,b:string,u:string,postId:string,connectionId?:string){
  await this.access.brand(t,w,b,u);
  const post=await this.db.contentPost.findFirst({where:{id:postId,brandId:b},
   include:{versions:{take:1,orderBy:{number:'desc'}}}});
  if(!post)throw new NotFoundException('Post not found');
  const last=post.versions[0];
  const format=conservativeXDraftCheck(last?.caption||'',last?.mediaUrls||[]);
  const preflight=await this.preflight.evaluate(t,w,b,u,postId,'x',connectionId);
  const policy=await this.db.socialProviderPolicy.findUnique({where:{network:'x'},select:{costApproved:true,apiApproved:true}});
  const budgetAuthorized=process.env.X_API_BUDGET_APPROVED==='true'&&
   Number(process.env.X_API_MAX_MONTHLY_USD_MINOR||0)>0&&Boolean(policy?.costApproved);
  return {network:'x',draftVersion:last?.number??null,format,
   budgetAuthorized,apiApproved:Boolean(policy?.apiApproved),
   preflight,canPost:false,
   reason:'Actual X API charges, provider upload rules and delivery are not implemented. This preview makes no network calls.'};
 }
}
