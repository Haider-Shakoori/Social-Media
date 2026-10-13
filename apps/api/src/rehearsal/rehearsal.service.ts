import {ConflictException,Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import {PreflightService,type PreflightNetwork} from '../preflight/preflight.service';
@Injectable()
export class RehearsalService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService,private readonly preflight:PreflightService){}
 async create(t:string,w:string,b:string,u:string,postId:string,network:PreflightNetwork,key:string){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  const exists=await this.db.dispatchRehearsal.findUnique({where:{brandId_requestKey:{brandId:b,requestKey:key}}});
  if(exists){
   if(exists.postId!==postId||exists.network!==network)throw new ConflictException('Idempotency key reused for different content');
   return {rehearsal:{id:exists.id,createdAt:exists.createdAt,results:exists.results},replay:true};
  }
  const post=await this.db.contentPost.findFirst({where:{id:postId,brandId:b},include:{versions:{orderBy:{number:'desc'},take:1}}});
  if(!post?.versions[0])throw new NotFoundException('Post not found');
  const versionId=post.versions[0].id;
  const check=await this.preflight.evaluate(t,w,b,u,postId,network);
  const results={
   kind:'DRY_RUN_ONLY',network,canPublish:false,externalApiCalled:false,providerChargeMinor:0,
   reasons:check.checks.filter(c=>!c.ok).map(c=>c.code),
   versionNumber:post.versions[0].number,
   note:'Snapshot captured for internal rehearsal only, no queued publishing, no provider request.',
  };
  try{
   const row=await this.db.dispatchRehearsal.create({data:{
    brandId:b,postId,network,requestKey:key,versionId,attemptedById:u,results,
   }});
   return {rehearsal:{id:row.id,createdAt:row.createdAt,results},replay:false};
  }catch(e){
   if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002'){
    const previous=await this.db.dispatchRehearsal.findUnique({where:{brandId_requestKey:{brandId:b,requestKey:key}}});
    if(previous?.postId===postId&&previous.network===network)return {rehearsal:{
     id:previous.id,createdAt:previous.createdAt,results:previous.results},replay:true};
    throw new ConflictException('Idempotency key conflict');
   }
   throw e;
  }
 }
 async list(t:string,w:string,b:string,u:string){
  await this.access.brand(t,w,b,u);
  const rows=await this.db.dispatchRehearsal.findMany({where:{brandId:b},orderBy:{createdAt:'desc'},
   take:50,select:{id:true,postId:true,network:true,createdAt:true,results:true}});
  return {runs:rows,notice:'Historical dry runs only. No published statuses or provider delivery confirmations.'};
 }
}
