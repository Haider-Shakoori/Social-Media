import {Injectable,ServiceUnavailableException,BadRequestException} from '@nestjs/common';
import {HeadObjectCommand,GetObjectCommand,PutObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {PrismaService} from '../prisma/prisma.service';
import {AccessService} from '../tenants/access.service';
import {makeUploadKey,issueUploadClaim,verifyUploadClaim,validateImageInput,validImageHeader,
 publicMediaUrl,MAX_IMAGE_BYTES,requireR2Config} from './media-storage';

@Injectable()
export class MediaUploadService{
 constructor(private readonly db:PrismaService,private readonly access:AccessService){}
 config(){
  try{requireR2Config();return {enabled:true,maxImageBytes:MAX_IMAGE_BYTES,types:['image/jpeg','image/png']};}
  catch{return {enabled:false,maxImageBytes:MAX_IMAGE_BYTES,types:['image/jpeg','image/png']};}
 }
 private client(){
  const cfg=requireR2Config();
  const s3=new S3Client({region:'auto',endpoint:cfg.endpoint,
   credentials:{accessKeyId:cfg.accessKeyId,secretAccessKey:cfg.secretAccessKey}});
  return {s3,cfg};
 }
 async presign(t:string,w:string,b:string,u:string,input:{fileName:string;mimeType:string;sizeBytes:number}){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  const mime=validateImageInput(input.mimeType,input.sizeBytes,input.fileName);
  const {s3,cfg}=this.client();
  const key=makeUploadKey(b,mime);
  const expires=Date.now()+10*60_000;
  try{
   const url=await getSignedUrl(s3,new PutObjectCommand({Bucket:cfg.bucket,Key:key,
    ContentType:mime,ContentLength:input.sizeBytes}),{expiresIn:120});
   return {uploadUrl:url,confirmation:issueUploadClaim({brandId:b,key,mime,size:input.sizeBytes,expires}),
    maxImageBytes:MAX_IMAGE_BYTES,expiresAt:new Date(expires).toISOString()};
  }finally{s3.destroy();}
 }
 async complete(t:string,w:string,b:string,u:string,input:{confirmation:string;altText:string}){
  await this.access.brand(t,w,b,u,['OWNER','ADMIN','EDITOR']);
  const claim=verifyUploadClaim(input.confirmation,b);
  const {s3,cfg}=this.client();
  try{
   const head=await s3.send(new HeadObjectCommand({Bucket:cfg.bucket,Key:claim.key}));
   if(head.ContentLength!==claim.size||head.ContentType!==claim.mime)
    throw new BadRequestException('Uploaded image does not match its signed size and MIME type');
   const obj=await s3.send(new GetObjectCommand({Bucket:cfg.bucket,Key:claim.key,Range:'bytes=0-31'}));
   const header=await obj.Body?.transformToByteArray();
   if(!header||!validImageHeader(claim.mime,header))
    throw new BadRequestException('The uploaded file is not a valid PNG/JPEG image');
   const url=publicMediaUrl(cfg.publicBase,claim.key);
   const existing=await this.db.mediaAsset.findFirst({where:{brandId:b,url}});
   if(existing)return {media:existing,alreadyRegistered:true};
   const media=await this.db.mediaAsset.create({data:{brandId:b,url,mimeType:claim.mime,
    altText:input.altText.slice(0,500)}});
   return {media,alreadyRegistered:false,notice:'Image registered. Drafts still require separate approval; nothing was published.'};
  }catch(error){
   if(error instanceof BadRequestException)throw error;
   throw new ServiceUnavailableException('Image upload could not be verified in object storage');
  }finally{s3.destroy();}
 }
}
