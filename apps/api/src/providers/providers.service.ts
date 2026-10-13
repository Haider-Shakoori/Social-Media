import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PROVIDER_CATALOG,PILOT_PROVIDER_CATALOG,buildManualExport,getProviderDescriptor,inspectProvider,isSocialNetwork,isPilotNetwork,
  type SocialNetwork,type ProviderRollout,
} from '@social/shared';
import type { z } from 'zod';
import { manualExportInput,policyUpdateInput } from './providers.dto';
type ExportData=z.infer<typeof manualExportInput>;
type PolicyData=z.infer<typeof policyUpdateInput>;
function shapeState(row:{rolloutState:string;operatorEnabled:boolean;apiApproved:boolean;costApproved:boolean;productionVerified:boolean}|undefined){
 if(!row)return undefined;
 return {rollout:row.rolloutState.toLowerCase() as ProviderRollout,operatorEnabled:row.operatorEnabled,
  apiApproved:row.apiApproved,costApproved:row.costApproved,productionVerified:row.productionVerified};
}
@Injectable()
export class ProvidersService {
 constructor(private readonly db:PrismaService){}
 private async tenantRole(userId:string,tenantId:string){
  const membership=await this.db.membership.findUnique({where:{tenantId_userId:{tenantId,userId}},select:{role:true}});
  if(!membership)throw new NotFoundException('Organization not found');
  return membership.role;
 }
 private async visibleBrand(userId:string,tenantId:string,workspaceId:string,brandId:string){
  const role=await this.tenantRole(userId,tenantId);
  const brand=await this.db.brand.findFirst({where:{id:brandId,workspaceId,archivedAt:null,workspace:{tenantId}},
    select:{id:true,name:true}});
  if(!brand)throw new NotFoundException('Brand not found');
  if(role!=='OWNER'&&role!=='ADMIN'){
   const member=await this.db.brandMember.findUnique({where:{brandId_userId:{brandId,userId}},select:{role:true}});
   if(!member)throw new NotFoundException('Brand not found');
   return {brand,role:member.role};
  }
  return {brand,role};
 }
 private async policies(){
  const data=await this.db.socialProviderPolicy.findMany();
  return new Map(data.map(x=>[x.network,x]));
 }
 private async catalog(){
  const stored=await this.policies();
  return PROVIDER_CATALOG.map(x=>inspectProvider(x.id,shapeState(stored.get(x.id))));
 }
 async tenantCatalog(userId:string,tenantId:string){
  await this.tenantRole(userId,tenantId);
  return {providers:(await this.catalog()).filter(x=>isPilotNetwork(x.id)),
    deferredProviders:PROVIDER_CATALOG.filter(x=>!isPilotNetwork(x.id)).map(x=>({id:x.id,name:x.name,phase:'future'})),
    notice:'Facebook, Instagram and X are the pilot. Other networks are deferred. Live publishing is disabled.'};
 }
 async brandCatalog(userId:string,tenantId:string,workspaceId:string,brandId:string){
  const {brand}=await this.visibleBrand(userId,tenantId,workspaceId,brandId);
  const connections=await this.db.socialConnection.findMany({where:{brandId},select:{
    id:true,platform:true,mode:true,state:true,createdAt:true,
  },take:50,orderBy:{createdAt:'desc'}});
  return {brand,providers:(await this.catalog()).filter(x=>isPilotNetwork(x.id)),
    deferredProviders:PROVIDER_CATALOG.filter(x=>!isPilotNetwork(x.id)).map(x=>({id:x.id,name:x.name,phase:'future'})),
    connections,notice:'Provider account links do not grant publishing rights.'};
 }
 async manualPackage(userId:string,tenantId:string,workspaceId:string,brandId:string,input:ExportData){
  const {role}=await this.visibleBrand(userId,tenantId,workspaceId,brandId);
  if(!isPilotNetwork(input.network))throw new ForbiddenException('Platform deferred to a future phase');
  if(!['OWNER','ADMIN','EDITOR'].includes(role))throw new ForbiddenException('Editor access required');
  const policy=await this.db.socialProviderPolicy.findUnique({where:{network:input.network},select:{rolloutState:true}});
  if(!policy||policy.rolloutState==='DISABLED'||policy.rolloutState==='RESTRICTED'){
   throw new ForbiddenException('Provider unavailable for manual export');
  }
  try {
   const result=buildManualExport(input.network,{caption:input.caption,contentType:input.contentType,
    mediaUrls:input.mediaUrls,destinationNote:input.destinationNote});
   return {package:result,notice:'Nothing was sent to a social network, queued, or persisted'};
  } catch(e) {
   throw new BadRequestException(e instanceof Error?e.message:'Invalid manual package');
  }
 }
 async operatorList(){
  const stored=await this.policies();
  return {providers:PROVIDER_CATALOG.map(descriptor=>({
    ...inspectProvider(descriptor.id,shapeState(stored.get(descriptor.id))),
    operatorEnabled:stored.get(descriptor.id)?.operatorEnabled??false,
    apiApproved:stored.get(descriptor.id)?.apiApproved??false,
    costApproved:stored.get(descriptor.id)?.costApproved??false,
    productionVerified:stored.get(descriptor.id)?.productionVerified??false,
    lastVerifiedAt:stored.get(descriptor.id)?.lastVerifiedAt??null,
    notes:stored.get(descriptor.id)?.notes??'',
   }))};
 }
 async updateOperator(actorId:string,network:string,input:PolicyData) {
  if(!isSocialNetwork(network))throw new NotFoundException('Unknown social provider');
  if(!isPilotNetwork(network))throw new ForbiddenException('Platform deferred to future roadmap');
  // A different future release process will verify OAuth, legal review and paid API billing.
  // Batch 7 has no route for production_ready, apiApproved, costApproved or productionVerified.
  if(input.operatorEnabled===true && input.rolloutState!=='TESTING'){
   throw new BadRequestException('Operator enablement is limited to reviewed test-mode catalog records');
  }
  return this.db.$transaction(async tx=>{
    const previous=await tx.socialProviderPolicy.findUnique({where:{network}});
    if(!previous)throw new NotFoundException('Provider policy not initialized');
    const state=input.rolloutState??previous.rolloutState;
    if(input.operatorEnabled===true&&state!=='TESTING')throw new BadRequestException('Cannot enable a non-testing provider');
    if(input.rolloutState&&input.rolloutState!=='TESTING'&&previous.operatorEnabled&&input.operatorEnabled!==false){
      throw new BadRequestException('Disable provider before changing rollout state');
    }
    const row=await tx.socialProviderPolicy.update({where:{network},data:{
      rolloutState:state,
      operatorEnabled:input.operatorEnabled===undefined?previous.operatorEnabled:input.operatorEnabled,
      notes:input.notes??previous.notes,updatedById:actorId,
    }});
    await tx.platformAuditEvent.create({data:{
      actorId,action:'provider.policy.update',resourceType:'social_provider',resourceId:network,
      details:{oldState:previous.rolloutState,newState:row.rolloutState,operatorEnabled:row.operatorEnabled},
    }});
    // No live connectors registered; setting does not enable OAuth or publishing.
    return {provider:inspectProvider(network as SocialNetwork,shapeState(row)),operatorEnabled:row.operatorEnabled};
  });
 }
}
