import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
import {BadRequestException,ServiceUnavailableException} from '@nestjs/common';

export const MAX_IMAGE_BYTES=8*1024*1024;
export type ImageMime='image/jpeg'|'image/png';
export type UploadClaim={brandId:string;key:string;mime:ImageMime;size:number;expires:number};
const keyPattern=/^media\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png)$/;
function validHttpsBase(base:string):URL{
 const url=new URL(base);
 const host=url.hostname.toLowerCase();
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||
  isIP(host)!==0||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||
  !host.includes('.'))throw new ServiceUnavailableException('Media public domain is not safely configured');
 return url;
}
export function publicMediaUrl(base:string,key:string):string{
 if(!keyPattern.test(key))throw new BadRequestException('Invalid media key');
 const url=validHttpsBase(base);
 if(url.pathname!=='/'&&!url.pathname.endsWith('/'))url.pathname+='/';
 return new URL(key,url).toString();
}
export function validateImageInput(mime:string,size:number,fileName:string):ImageMime{
 if(mime!=='image/jpeg'&&mime!=='image/png')throw new BadRequestException('Only JPEG and PNG images are allowed');
 if(!Number.isSafeInteger(size)||size<=0||size>MAX_IMAGE_BYTES)
  throw new BadRequestException('Image size must be between 1 byte and 8 MB');
 if(fileName.length>180||!/^[a-zA-Z0-9][a-zA-Z0-9 ._()\-]{0,179}$/.test(fileName))
  throw new BadRequestException('Invalid image filename');
 const ext=fileName.split('.').pop()?.toLowerCase();
 if(mime==='image/png'&&ext!=='png'||mime==='image/jpeg'&&ext!=='jpg'&&ext!=='jpeg')
  throw new BadRequestException('Image extension and MIME type must match');
 return mime;
}
export function validImageHeader(mime:ImageMime,data:Uint8Array):boolean{
 if(mime==='image/png')return data.length>=8&&
  [137,80,78,71,13,10,26,10].every((byte,i)=>data[i]===byte);
 return data.length>=3&&data[0]===255&&data[1]===216&&data[2]===255;
}
export function makeUploadKey(brandId:string,mime:ImageMime):string{
 if(!/^[0-9a-f-]{36}$/.test(brandId))throw new BadRequestException('Invalid brand');
 return 'media/'+brandId+'/'+randomUUID()+(mime==='image/png'?'.png':'.jpg');
}
function signer():Buffer{
 const raw=process.env.MEDIA_UPLOAD_SIGNING_KEY||'';
 // Independent key; never reuse SMTP, Instagram, JWT or social-token keys.
 const bytes=Buffer.from(raw,'base64');
 if(bytes.length!==32||bytes.toString('base64')!==raw)
  throw new ServiceUnavailableException('Media upload signing key not configured');
 return bytes;
}
export function issueUploadClaim(claim:UploadClaim):string{
 if(!keyPattern.test(claim.key))throw new BadRequestException('Invalid upload key');
 const encoded=Buffer.from(JSON.stringify(claim)).toString('base64url');
 const sig=createHmac('sha256',signer()).update(encoded).digest('base64url');
 return encoded+'.'+sig;
}
export function verifyUploadClaim(token:string,brandId:string):UploadClaim{
 if(token.length>1500||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
  throw new BadRequestException('Invalid upload confirmation');
 const [payload,signature]=token.split('.');
 const signed=createHmac('sha256',signer()).update(payload).digest();
 const provided=Buffer.from(signature,'base64url');
 if(signed.length!==provided.length||!timingSafeEqual(signed,provided))
  throw new BadRequestException('Invalid upload confirmation');
 let claim:UploadClaim;
 try{claim=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as UploadClaim;}
 catch{throw new BadRequestException('Invalid upload confirmation');}
 if(claim.brandId!==brandId||!keyPattern.test(claim.key)||
  !claim.key.startsWith('media/'+brandId+'/')||
  !['image/jpeg','image/png'].includes(claim.mime)||
  !Number.isSafeInteger(claim.size)||claim.size<=0||claim.size>MAX_IMAGE_BYTES||
  !Number.isSafeInteger(claim.expires)||claim.expires<Date.now()||
  claim.expires>Date.now()+20*60*1000)
  throw new BadRequestException('Upload confirmation expired or invalid');
 return claim;
}
export function requireR2Config(){
 if(process.env.MEDIA_UPLOADS_ENABLED!=='true')
  throw new ServiceUnavailableException('Media uploads are disabled until object storage is configured');
 for(const key of ['MEDIA_R2_ENDPOINT','MEDIA_R2_BUCKET','MEDIA_R2_ACCESS_KEY_ID',
  'MEDIA_R2_SECRET_ACCESS_KEY','MEDIA_PUBLIC_BASE_URL']){
  if(!process.env[key])throw new ServiceUnavailableException('Media storage has not been configured');
 }
 signer();
 const url=validHttpsBase(process.env.MEDIA_R2_ENDPOINT!);
 if(!/\.r2\.cloudflarestorage\.com$/.test(url.hostname)||url.pathname!=='/')
  throw new ServiceUnavailableException('Media object storage endpoint must be a Cloudflare R2 endpoint');
 validHttpsBase(process.env.MEDIA_PUBLIC_BASE_URL!);
 return {
  endpoint:url.origin,bucket:process.env.MEDIA_R2_BUCKET!,
  accessKeyId:process.env.MEDIA_R2_ACCESS_KEY_ID!,
  secretAccessKey:process.env.MEDIA_R2_SECRET_ACCESS_KEY!,
  publicBase:process.env.MEDIA_PUBLIC_BASE_URL!,
 };
}
