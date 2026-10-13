import {Injectable,NotFoundException,ForbiddenException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
@Injectable()
export class AgencyService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async overview(tenantId:string,userId:string){
  const role=await this.access.tenantRole(tenantId,userId);
  if(role!=='OWNER'&&role!=='ADMIN')throw new ForbiddenException('Agency manager required');
  const workspaces=await this.db.workspace.findMany({where:{tenantId},select:{
   id:true,name:true,timezone:true,
   brands:{where:{archivedAt:null},orderBy:{createdAt:'desc'},select:{
    id:true,name:true,locale:true,publishingPaused:true,
    _count:{select:{posts:true,connections:true,members:true,calendarSlots:true}},
   }},
  },orderBy:{createdAt:'asc'},take:100});
  return {source:'internal_first_party',tenantId,workspaces,externalSocialMetrics:null,
   note:'Internal agency activity counts only. External Meta/X insights are not connected.'};
 }
 async clientReport(tenantId:string,workspaceId:string,brandId:string,userId:string,days:number){
  await this.access.brand(tenantId,workspaceId,brandId,userId);
  const brand=await this.db.brand.findFirst({where:{id:brandId,workspaceId,archivedAt:null},select:{id:true,name:true,locale:true}});
  if(!brand)throw new NotFoundException('Brand not found');
  const since=new Date(Date.now()-days*86400000);
  const [drafts,approvals,manualDue]=await Promise.all([
   this.db.contentPost.count({where:{brandId,createdAt:{gte:since}}}),
   this.db.approvalRequest.count({where:{postVersion:{post:{brandId}},state:'APPROVED',reviewedAt:{gte:since}}}),
   this.db.calendarSlot.count({where:{brandId,state:'MANUAL_DUE',scheduledAt:{gte:since}}}),
  ]);
  return {brand,periodDays:days,source:'internal_first_party',counts:{drafts,approvals,manualDue},
   engagement:null,impressions:null,reach:null,followers:null,
   limitations:['Counts do not indicate social delivery','No provider analytics verification'],generatedAt:new Date().toISOString()};
 }
}
