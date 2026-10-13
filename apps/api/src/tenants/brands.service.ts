import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from './access.service';
import type { z } from 'zod';
import { brandInput, brandPatchInput } from '../security/dto';
type BrandInput=z.infer<typeof brandInput>;
type BrandPatch=z.infer<typeof brandPatchInput>;
const fields={
  id:true,workspaceId:true,name:true,locale:true,industry:true,description:true,
  website:true,logoUrl:true,primaryColor:true,targetAudience:true,tone:true,languages:true,
  createdAt:true,updatedAt:true,archivedAt:true,
} as const;
@Injectable()
export class BrandsService {
  constructor(private readonly db:PrismaService,private readonly access:AccessService){}
  async list(userId:string,tenantId:string,workspaceId:string) {
    const {role}=await this.access.workspace(tenantId,workspaceId,userId);
    const brands=await this.db.brand.findMany({
      where:{workspaceId,archivedAt:null,...(!this.access.isManager(role)?{members:{some:{userId}}}:{})},
      select:fields,orderBy:{createdAt:'desc'},take:100,
    });
    return {brands};
  }
  async create(userId:string,tenantId:string,workspaceId:string,input:BrandInput){
    const {role}=await this.access.workspace(tenantId,workspaceId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    const brand=await this.db.brand.create({data:{workspaceId,...input},select:fields});
    return {brand};
  }
  async update(userId:string,tenantId:string,workspaceId:string,brandId:string,input:BrandPatch){
    await this.access.brand(tenantId,workspaceId,brandId,userId,['OWNER','ADMIN','EDITOR']);
    const result=await this.db.brand.updateMany({where:{id:brandId,workspaceId,archivedAt:null},data:input});
    if(result.count!==1)throw new NotFoundException('Brand unavailable');
    const brand=await this.db.brand.findFirstOrThrow({where:{id:brandId,workspaceId},select:fields});
    return {brand};
  }
  async archive(userId:string,tenantId:string,workspaceId:string,brandId:string){
    const {role}=await this.access.brand(tenantId,workspaceId,brandId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    // No destructive delete; future scheduled jobs also need archivedAt checks.
    const result=await this.db.brand.updateMany({where:{id:brandId,workspaceId,archivedAt:null},data:{archivedAt:new Date()}});
    if(result.count!==1)throw new NotFoundException('Brand unavailable');
    return {message:'Brand archived. Future publishing must remain blocked.'};
  }
  async listAccess(userId:string,tenantId:string,workspaceId:string,brandId:string){
    const {role}=await this.access.brand(tenantId,workspaceId,brandId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    const members=await this.db.brandMember.findMany({where:{brandId},select:{
      userId:true,role:true,createdAt:true,user:{select:{fullName:true,email:true}},
    },orderBy:{createdAt:'asc'}});
    return {members};
  }
  async grant(userId:string,tenantId:string,workspaceId:string,brandId:string,targetId:string,grantRole:'EDITOR'|'APPROVER'|'VIEWER') {
    const {role}=await this.access.brand(tenantId,workspaceId,brandId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    const member=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId:targetId}},select:{role:true}});
    if(!member)throw new NotFoundException('The user is not a member of this organization');
    if(this.access.isManager(member.role))throw new ConflictException('Owners and administrators already have access to all brands');
    const grant=await this.db.brandMember.upsert({
      where:{brandId_userId:{brandId,userId:targetId}},
      create:{brandId,userId:targetId,role:grantRole},
      update:{role:grantRole},
      select:{userId:true,role:true},
    });
    return {grant};
  }
  async revoke(userId:string,tenantId:string,workspaceId:string,brandId:string,targetId:string){
    const {role}=await this.access.brand(tenantId,workspaceId,brandId,userId);
    this.access.requireRole(role,['OWNER','ADMIN']);
    await this.db.brandMember.deleteMany({where:{brandId,userId:targetId}});
    return {message:'Brand access revoked'};
  }
}
