import {Injectable,ForbiddenException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
@Injectable()
export class XBudgetService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async get(tenantId:string,userId:string){
  const role=await this.access.tenantRole(tenantId,userId);
  if(!['OWNER','ADMIN'].includes(role))throw new ForbiddenException('Financial manager access required');
  const policy=await this.db.xBudgetPolicy.findUnique({where:{tenantId}});
  return {currency:'USD',units:'minor_us_cents',monthlyCeilingMinor:policy?.monthlyCeilingMinor??0,
   paidCallsEnabled:false,operatorApproved:policy?.operatorApproved??false,
   measuredProviderSpendMinor:null,measuredProviderUsage:false,
   hardEnforcementAvailable:false,
   limitation:'No paid X operation is enabled or tracked yet. A configured ceiling is only a planning cap, not verified protection against X charges.'};
 }
 async set(tenantId:string,userId:string,monthlyCeilingMinor:number){
  const role=await this.access.tenantRole(tenantId,userId);
  if(role!=='OWNER')throw new ForbiddenException('Organization owner required');
  return this.db.$transaction(async tx=>{
   const policy=await tx.xBudgetPolicy.upsert({where:{tenantId},
    create:{tenantId,monthlyCeilingMinor,operatorApproved:false,paidCallsEnabled:false},
    update:{monthlyCeilingMinor,operatorApproved:false,paidCallsEnabled:false},
   });
   await tx.platformAuditEvent.create({data:{actorId:userId,action:'x.budget.planning_change',
    resourceType:'tenant',resourceId:tenantId,details:{monthlyCeilingMinor,
     note:'Planning cap only; no approved API calls'}}});
   return {monthlyCeilingMinor:policy.monthlyCeilingMinor,paidCallsEnabled:false};
  });
 }
}
