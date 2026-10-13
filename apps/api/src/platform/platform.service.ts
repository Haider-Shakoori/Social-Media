import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CmsEntryStatus, CmsEntryType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { cmsEntryInput,cmsEntryPatch, settingValue } from './platform.dto';
import type { z } from 'zod';
type Input=z.infer<typeof cmsEntryInput>;
type Patch=z.infer<typeof cmsEntryPatch>;
const publicSelect={
  slug:true,type:true,locale:true,title:true,description:true,category:true,readingTime:true,
  sections:true,publishedAt:true,updatedAt:true,
} as const;

@Injectable()
export class PlatformService {
  constructor(private readonly db:PrismaService){}
  private async audit(tx:Prisma.TransactionClient,actorId:string,action:string,resourceType:string,resourceId:string|null,details:Record<string,string|number|boolean|null>={}){
    await tx.platformAuditEvent.create({data:{actorId,action,resourceType,resourceId,details}});
  }
  async overview(){
    const [tenants,users,workspaces,brands,connections,postStates,subscriptions,unverifiedEmails,pendingInvitations]=await Promise.all([
      this.db.tenant.count(),this.db.user.count(),this.db.workspace.count(),
      this.db.brand.count({where:{archivedAt:null}}),this.db.socialConnection.count(),
      this.db.contentPost.groupBy({by:['state'],_count:{_all:true}}),
      this.db.subscription.groupBy({by:['state'],_count:{_all:true}}),
      this.db.user.count({where:{emailVerifiedAt:null}}),
      this.db.tenantInvitation.count({where:{acceptedAt:null,revokedAt:null,expiresAt:{gt:new Date()}}}),
    ]);
    return {tenants,users,workspaces,brands,connections,unverifiedEmails,pendingInvitations,
      posts:postStates.map(x=>({state:x.state,count:x._count._all})),
      subscriptions:subscriptions.map(x=>({state:x.state,count:x._count._all})),
      note:'Stored subscription states may differ from effective expiry; consult individual tenant billing for live entitlement.',
    };
  }
  async users(page:number){
    const take=25,skip=(page-1)*take;
    const [total,users]=await this.db.$transaction([
      this.db.user.count(),
      this.db.user.findMany({orderBy:{createdAt:'desc'},take,skip,
        select:{id:true,email:true,fullName:true,emailVerifiedAt:true,createdAt:true,isPlatformAdmin:true,
          _count:{select:{memberships:true,sessions:true}}}}),
    ]);
    return {page,total,pageSize:take,users};
  }
  async tenants(page:number){
    const take=25,skip=(page-1)*take;
    const [total,tenants]=await this.db.$transaction([
      this.db.tenant.count(),
      this.db.tenant.findMany({orderBy:{createdAt:'desc'},skip,take,select:{
        id:true,name:true,slug:true,createdAt:true,
        subscription:{select:{state:true,periodEnd:true,plan:{select:{code:true,name:true}}}},
        _count:{select:{memberships:true,workspaces:true}},
      }}),
    ]);
    return {page,total,pageSize:take,tenants};
  }
  async auditEvents(page:number){
    const take=30,skip=(page-1)*take;
    const [total,events]=await this.db.$transaction([
      this.db.platformAuditEvent.count(),
      this.db.platformAuditEvent.findMany({orderBy:{createdAt:'desc'},take,skip,
        select:{id:true,action:true,resourceType:true,resourceId:true,createdAt:true,details:true,
          actor:{select:{id:true,email:true}}}}),
    ]);
    return {page,total,pageSize:take,events};
  }
  async settings(){
    return {settings:await this.db.platformSetting.findMany({select:{key:true,value:true,updatedAt:true},orderBy:{key:'asc'}})};
  }
  async saveSetting(actorId:string,key:string,value:boolean|string){
    let safeValue:boolean|string;
    try{safeValue=settingValue(key,value);}catch(e){throw new BadRequestException(e instanceof Error?e.message:'Invalid setting');}
    return this.db.$transaction(async tx=>{
      const setting=await tx.platformSetting.upsert({
        where:{key},create:{key,value:safeValue,updatedById:actorId},
        update:{value:safeValue,updatedById:actorId},
        select:{key:true,value:true,updatedAt:true},
      });
      await this.audit(tx,actorId,'platform.setting.update','setting',key,{key});
      return {setting};
    });
  }
  async listEntries(page:number,type?:CmsEntryType,status?:CmsEntryStatus,locale?:string){
    const take=25,skip=(page-1)*take,where={type,status,locale};
    const [total,entries]=await this.db.$transaction([
      this.db.cmsEntry.count({where}),
      this.db.cmsEntry.findMany({where,orderBy:{updatedAt:'desc'},take,skip,select:{
        id:true,type:true,locale:true,slug:true,title:true,description:true,category:true,readingTime:true,
        sections:true,status:true,revision:true,publishedAt:true,updatedAt:true,createdAt:true,
      }}),
    ]);
    return {page,total,pageSize:take,entries};
  }
  async createEntry(actorId:string,input:Input){
    try {
      return await this.db.$transaction(async tx=>{
        const entry=await tx.cmsEntry.create({data:{...input,sections:input.sections,createdById:actorId,updatedById:actorId}});
        await this.audit(tx,actorId,'cms.create','cms',entry.id,{type:entry.type,slug:entry.slug});
        return {entry};
      });
    }catch(e){
      if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002')throw new ConflictException('A resource with this slug already exists');
      throw e;
    }
  }
  async editEntry(actorId:string,id:string,revision:number,patch:Patch){
    return this.db.$transaction(async tx=>{
      // Optimistic revision guards against overwriting another editor's work.
      const count=await tx.cmsEntry.updateMany({where:{id,revision,status:{not:'ARCHIVED'}},
        data:{...patch,updatedById:actorId,revision:{increment:1},status:'DRAFT',publishedAt:null}});
      if(count.count!==1)throw new ConflictException('Content changed elsewhere or has been archived. Reload before saving');
      const entry=await tx.cmsEntry.findUniqueOrThrow({where:{id}});
      await this.audit(tx,actorId,'cms.edit','cms',id,{revision:entry.revision,unpublished:true});
      return {entry};
    });
  }
  async changeStatus(actorId:string,id:string,expectedRevision:number,status:'PUBLISHED'|'ARCHIVED'|'DRAFT'){
    return this.db.$transaction(async tx=>{
      const before=await tx.cmsEntry.findUnique({where:{id},select:{status:true,revision:true}});
      if(!before)throw new NotFoundException('Content not found');
      if(before.status==='ARCHIVED')throw new ConflictException('Archived content is immutable');
      if(status==='PUBLISHED' && process.env.CMS_PUBLISHING_ENABLED!=='true'){
        throw new ConflictException('CMS publishing is disabled by the operator');
      }
      const changed=await tx.cmsEntry.updateMany({
        where:{id,revision:expectedRevision,status:{not:'ARCHIVED'}},
        data:{status,revision:{increment:1},updatedById:actorId,publishedAt:status==='PUBLISHED'?new Date():null},
      });
      if(changed.count!==1)throw new ConflictException('Content changed elsewhere. Reload before publishing');
      const entry=await tx.cmsEntry.findUniqueOrThrow({where:{id}});
      await this.audit(tx,actorId,'cms.'+status.toLowerCase(),'cms',id,{revision:entry.revision});
      return {entry};
    });
  }
  private async publicEnabled(){
    if(process.env.CMS_PUBLIC_ENABLED!=='true')return false;
    const setting=await this.db.platformSetting.findUnique({where:{key:'cms_public_enabled'}});
    return setting?.value===true;
  }
  async publicList(type:CmsEntryType,locale:string){
    if(!await this.publicEnabled())return {items:[]};
    const entries=await this.db.cmsEntry.findMany({
      where:{type,locale,status:'PUBLISHED'},select:publicSelect,orderBy:{publishedAt:'desc'},take:100,
    });
    return {items:entries};
  }
  async publicDetail(type:CmsEntryType,locale:string,slug:string){
    if(!await this.publicEnabled())throw new NotFoundException('Content not published');
    const item=await this.db.cmsEntry.findUnique({
      where:{type_locale_slug:{type,locale,slug}},select:{...publicSelect,status:true},
    });
    if(!item||item.status!=='PUBLISHED')throw new NotFoundException('Content not published');
    const {status:_,...resource}=item;
    return resource;
  }
}
