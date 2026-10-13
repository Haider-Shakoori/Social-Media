import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly db:PrismaService) {}

  async tenantRole(tenantId:string,userId:string):Promise<MembershipRole> {
    const member=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId}},select:{role:true}});
    if(!member)throw new NotFoundException('Resource not found');
    return member.role;
  }
  requireRole(role:MembershipRole,allowed:readonly MembershipRole[]):void {
    if(!allowed.includes(role))throw new ForbiddenException('Insufficient permissions');
  }
  isManager(role:MembershipRole):boolean{return role==='OWNER'||role==='ADMIN';}
  async workspace(tenantId:string,workspaceId:string,userId:string) {
    const role=await this.tenantRole(tenantId,userId);
    const workspace=await this.db.workspace.findFirst({where:{id:workspaceId,tenantId},select:{id:true,tenantId:true}});
    if(!workspace)throw new NotFoundException('Resource not found');
    return {workspace,role};
  }
  async brand(tenantId:string,workspaceId:string,brandId:string,userId:string,allowed:readonly MembershipRole[]=['OWNER','ADMIN','EDITOR','APPROVER','VIEWER']) {
    const {role}=await this.workspace(tenantId,workspaceId,userId);
    const brand=await this.db.brand.findFirst({
      where:{id:brandId,workspaceId,archivedAt:null},select:{id:true,workspaceId:true},
    });
    if(!brand)throw new NotFoundException('Resource not found');
    if(this.isManager(role))return {brand,role,brandRole:role};
    const access=await this.db.brandMember.findUnique({
      where:{brandId_userId:{brandId,userId}},select:{role:true}
    });
    if(!access)throw new NotFoundException('Resource not found');
    this.requireRole(access.role,allowed);
    return {brand,role,brandRole:access.role};
  }
}
