import {Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';import {AccessService} from '../tenants/access.service';
@Injectable()
export class ProtectionService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async get(t:string,w:string,b:string,u:string){
  await this.access.brand(t,w,b,u);
  const [brand,global]=await Promise.all([
   this.db.brand.findUniqueOrThrow({where:{id:b},select:{id:true,publishingPaused:true,pauseReason:true,
    connections:{select:{id:true,platform:true,state:true,pausedAt:true}}}}),
   this.db.platformSetting.findUnique({where:{key:'global_social_pause'}}),
  ]);
  return {brand,globalPaused:global?.value!==false,effectiveSocialPublishingAllowed:false,
   note:'Social publishing is not deployed; unpausing a brand cannot override global platform safety or missing official publishing adapter'};
 }
 async pause(t:string,w:string,b:string,u:string,input:{paused:boolean;reason:string}){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN']);
  const brand=await this.db.$transaction(async tx=>{
   const value=await tx.brand.update({where:{id:b},data:{publishingPaused:input.paused,pauseReason:input.reason},
    select:{id:true,publishingPaused:true,pauseReason:true}});
   await tx.platformAuditEvent.create({data:{actorId:u,action:'social.brand.pause',resourceType:'brand',resourceId:b,
    details:{paused:input.paused,reason:input.reason,tenantId:t}}});
   return value;
  });
  return {brand,effectiveSocialPublishingAllowed:false};
 }
 async restrict(t:string,w:string,b:string,u:string,id:string){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN']);
  return this.db.$transaction(async tx=>{
   const con=await tx.socialConnection.findFirst({where:{id,brandId:b}});
   if(!con)throw new NotFoundException('Account not found');
   const item=await tx.socialConnection.update({where:{id},data:{state:'RESTRICTED',pausedAt:new Date(),
    encryptedCredentials:null,tokenScopes:[],tokenExpiresAt:null},select:{id:true,platform:true,state:true}});
   await tx.platformAuditEvent.create({data:{actorId:u,action:'social.account.restrict',resourceType:'social_connection',
    resourceId:id,details:{tenantId:t,brandId:b}}});
   return {connection:item,notice:'Encrypted local token cleared. Re-authorize and revoke provider-side app access if needed.'};
  });
 }
}
