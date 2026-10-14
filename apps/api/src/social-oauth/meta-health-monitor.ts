import {Injectable,OnModuleDestroy,OnModuleInit} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {unseal} from './oauth-crypto';
import {inspectMetaAccount,MetaAccessError,metaScopeHealth,type MetaAccount} from './meta-account';

/** Small, opt-in Meta-only monitor. Never posts, refreshes or changes operator policy. */
@Injectable()
export class MetaHealthMonitor implements OnModuleInit,OnModuleDestroy {
 private interval?:ReturnType<typeof setInterval>;
 private running=false;
 constructor(private readonly db:PrismaService){}
 onModuleInit():void{
  if(process.env.META_HEALTH_MONITOR_ENABLED!=='true'||process.env.META_CONNECT_ENABLED!=='true')return;
  // Keep this off in staging until Meta app review and test-account authorization.
  this.interval=setInterval(()=>{void this.checkBatch();},6*60*60*1000);
  this.interval.unref?.();
  void this.checkBatch();
 }
 onModuleDestroy():void{if(this.interval)clearInterval(this.interval);}
 async checkBatch():Promise<void>{
  if(this.running||process.env.META_HEALTH_MONITOR_ENABLED!=='true'||process.env.META_CONNECT_ENABLED!=='true')return;
  this.running=true;
  try{
   const stale=new Date(Date.now()-6*60*60*1000);
   const rows=await this.db.socialConnection.findMany({
    where:{platform:{in:['facebook','instagram']},mode:'OFFICIAL',state:{in:['CONNECTED','LIMITED']},
     encryptedCredentials:{not:null},OR:[{lastHealthCheckedAt:null},{lastHealthCheckedAt:{lt:stale}}]},
    orderBy:{lastHealthCheckedAt:'asc'},take:20,
   });
   for(const row of rows){
    if(!row.encryptedCredentials||!row.externalAccountId)continue;
    let health;
    try{
     health=await inspectMetaAccount({
      platform:row.platform as 'facebook'|'instagram',externalAccountId:row.externalAccountId,
      credentials:unseal<MetaAccount['credentials']>(row.encryptedCredentials),expiresAt:row.tokenExpiresAt,
     });
    }catch(error){
     if(!(error instanceof MetaAccessError)||error.kind!=='restricted')continue;
     health=metaScopeHealth(row.platform as 'facebook'|'instagram',[],false);
    }
    // Compare-and-swap prevents a late health response overwriting a user refresh/disconnect.
    await this.db.socialConnection.updateMany({
     where:{id:row.id,encryptedCredentials:row.encryptedCredentials,state:{in:['CONNECTED','LIMITED']}},
     data:{state:health.state,tokenScopes:health.grantedScopes,lastHealthCheckedAt:new Date(),
      lastHealthReason:health.reason,pausedAt:health.state==='CONNECTED'?null:new Date()},
    });
   }
  }catch{
   // Never print account data or credentials; a temporary DB error cannot enable publishing.
   console.warn('Meta account monitor encountered an error');
  }finally{this.running=false;}
 }
}
