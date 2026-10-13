import { ConflictException, ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../billing/entitlements.service';
@Injectable()
export class TenantsService {
  constructor(private readonly db:PrismaService,private readonly quotas:EntitlementsService){}
  async list(userId:string){
    const memberships=await this.db.membership.findMany({
      where:{userId},include:{tenant:{select:{id:true,slug:true,name:true,createdAt:true}}},
      orderBy:{createdAt:'asc'},
    });
    return {tenants:memberships.map(m=>({...m.tenant,role:m.role}))};
  }
  async create(userId:string,name:string,slug:string){
    try {
      const tenant=await this.db.$transaction(async tx=>{
        const plan=await tx.plan.findUnique({where:{code:'trial'}});
        if(!plan||!plan.enabled||plan.trialDays<1)throw new ConflictException('Trial plan is not available');
        const now=new Date(),end=new Date(now.getTime()+plan.trialDays*86400000);
        const created=await tx.tenant.create({
          data:{name,slug,memberships:{create:{userId,role:'OWNER'}},
            workspaces:{create:{name:'Main Workspace',timezone:'UTC'}}},
          select:{id:true,name:true,slug:true,workspaces:{select:{id:true,name:true,timezone:true}}},
        });
        await tx.subscription.create({data:{tenantId:created.id,planId:plan.id,state:'TRIALING',
          cycle:'MONTHLY',periodStart:now,periodEnd:end,trialEndsAt:end,
          maxBrands:plan.maxBrands,maxSeats:plan.maxSeats,maxConnections:plan.maxConnections,
          monthlyAiText:plan.monthlyAiText,monthlyAiImage:plan.monthlyAiImage,
          monthlyScheduledPosts:plan.monthlyScheduledPosts,
        }});
        return created;
      });
      return {tenant};
    } catch(error){
      if(typeof error==='object'&&error!==null&&'code' in error&&error.code==='P2002')throw new ConflictException('Workspace slug already in use');
      throw error;
    }
  }
  private async membership(tenantId:string,userId:string){
    const member=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId}}});
    if(!member)throw new NotFoundException('Workspace not found');
    return member;
  }
  private ensureRole(role:MembershipRole,roles:MembershipRole[]){
    if(!roles.includes(role)) throw new ForbiddenException('Insufficient workspace permissions');
  }
  async listWorkspaces(userId:string,tenantId:string){
    const member=await this.membership(tenantId,userId);
    const workspaces=await this.db.workspace.findMany({where:{tenantId:member.tenantId},select:{
      id:true,tenantId:true,name:true,timezone:true,createdAt:true
    },orderBy:{createdAt:'asc'}});
    return {workspaces,role:member.role};
  }
  async createWorkspace(userId:string,tenantId:string,name:string,timezone:string){
    const member=await this.membership(tenantId,userId);
    this.ensureRole(member.role,['OWNER','ADMIN']);
    try{new Intl.DateTimeFormat('en-US',{timeZone:timezone});}catch{throw new BadRequestException('Invalid IANA timezone');}
    const workspace=await this.db.workspace.create({data:{tenantId:member.tenantId,name,timezone},select:{
      id:true,tenantId:true,name:true,timezone:true,
    }});
    return {workspace};
  }
  async listMembers(userId:string,tenantId:string){
    const member=await this.membership(tenantId,userId);
    this.ensureRole(member.role,['OWNER','ADMIN']);
    const members=await this.db.membership.findMany({where:{tenantId:member.tenantId},select:{
      userId:true,role:true,user:{select:{email:true,fullName:true}},createdAt:true,
    }});
    return {members};
  }
  async updateRole(userId:string,tenantId:string,targetId:string,role:'ADMIN'|'EDITOR'|'APPROVER'|'VIEWER'){
    const member=await this.membership(tenantId,userId);
    this.ensureRole(member.role,['OWNER']);
    if(userId===targetId) throw new ForbiddenException('The owner cannot change their own role');
    const target=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId:targetId}}});
    if(!target)throw new NotFoundException('Member not found');
    if(target.role==='OWNER')throw new ForbiddenException('Owner role may not be changed');
    const updated=await this.db.membership.update({where:{id:target.id},data:{role},select:{userId:true,role:true}});
    return {member:updated};
  }
  async removeMember(userId:string,tenantId:string,targetUserId:string) {
    const operator=await this.membership(tenantId,userId);
    this.ensureRole(operator.role,['OWNER']);
    if(targetUserId===userId)throw new ForbiddenException('An owner cannot remove themselves');
    await this.db.$transaction(async(tx)=>{
      const target=await tx.membership.findUnique({where:{tenantId_userId:{tenantId,userId:targetUserId}}});
      if(!target)throw new NotFoundException('Member not found');
      if(target.role==='OWNER')throw new ForbiddenException('Owner membership cannot be removed');
      await tx.brandMember.deleteMany({where:{
        userId:targetUserId,brand:{workspace:{tenantId}},
      }});
      await tx.membership.delete({where:{id:target.id}});
    });
    return {message:'Team member removed and organization brand access revoked'};
  }

}
