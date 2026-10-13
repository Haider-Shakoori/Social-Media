import {ConflictException,ForbiddenException,Injectable,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import type {z} from 'zod';
import {contentInput,versionInput,campaignInput,mediaInput} from './studio.dto';
@Injectable()
export class StudioService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 async guard(t:string,w:string,b:string,user:string,manage=false){
  return this.access.brand(t,w,b,user,manage?['OWNER','ADMIN','EDITOR']:['OWNER','ADMIN','EDITOR','APPROVER','VIEWER']);
 }
 async list(t:string,w:string,b:string,user:string){
  await this.guard(t,w,b,user);
  const [posts,campaigns,media]=await Promise.all([
   this.db.contentPost.findMany({where:{brandId:b},take:100,orderBy:{createdAt:'desc'},select:{
    id:true,state:true,createdAt:true,campaignId:true,versions:{take:1,orderBy:{number:'desc'},select:{id:true,number:true,caption:true,mediaUrls:true,language:true}}}}),
   this.db.contentCampaign.findMany({where:{brandId:b},take:100,select:{id:true,name:true,description:true}}),
   this.db.mediaAsset.findMany({where:{brandId:b},take:100,select:{id:true,url:true,mimeType:true,altText:true}}),
  ]);
  return {posts,campaigns,media,notice:'Drafts are private and never published automatically'};
 }
 async create(t:string,w:string,b:string,user:string,input:z.infer<typeof contentInput>){
  await this.guard(t,w,b,user,true);
  if(input.campaignId){
   const campaign=await this.db.contentCampaign.findFirst({where:{id:input.campaignId,brandId:b}});
   if(!campaign)throw new NotFoundException('Campaign not in brand');
  }
  const post=await this.db.contentPost.create({data:{brandId:b,campaignId:input.campaignId||null,
   versions:{create:{number:1,caption:input.caption,mediaUrls:input.mediaUrls,language:input.language}}},
   include:{versions:true}});
  return {post};
 }
 async revise(t:string,w:string,b:string,user:string,id:string,input:z.infer<typeof versionInput>){
  await this.guard(t,w,b,user,true);
  try{
   return await this.db.$transaction(async tx=>{
    const post=await tx.contentPost.findFirst({where:{id,brandId:b}});
    if(!post)throw new NotFoundException('Post not found');
    if(['PUBLISHED','PUBLISHING','SCHEDULED'].includes(post.state))throw new ForbiddenException('Scheduled or published content must be unscheduled before editing');
    const latest=await tx.postVersion.findFirst({where:{postId:id},orderBy:{number:'desc'}});
    if(!latest||latest.number!==input.expectedVersion)throw new ConflictException('Draft changed; refresh');
    const version=await tx.postVersion.create({data:{postId:id,number:latest.number+1,caption:input.caption,mediaUrls:input.mediaUrls,language:input.language}});
    await tx.approvalRequest.updateMany({where:{postVersion:{postId:id},state:{in:['PENDING','APPROVED']}},data:{state:'REVOKED'}});
    await tx.contentPost.update({where:{id},data:{state:'DRAFT'}});
    return {version,reapprovalRequired:true};
   });
  }catch(e){if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002')throw new ConflictException('Concurrent editor updated the post');throw e;}
 }
 async campaigns(t:string,w:string,b:string,user:string,input:z.infer<typeof campaignInput>){
  await this.guard(t,w,b,user,true);
  return {campaign:await this.db.contentCampaign.create({data:{brandId:b,...input}})};
 }
 async media(t:string,w:string,b:string,user:string,input:z.infer<typeof mediaInput>){
  await this.guard(t,w,b,user,true);
  return {media:await this.db.mediaAsset.create({data:{brandId:b,...input}}),
   notice:'HTTPS reference only: file upload, virus scanning and ownership checks are not implemented yet.'};
 }
}
