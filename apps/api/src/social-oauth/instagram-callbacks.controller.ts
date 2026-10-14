import {BadRequestException,Body,Controller,Get,Post,Query} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {unseal} from './oauth-crypto';
import {deletionReceipt,signedInstagramUser,validDeletionReceipt} from './instagram-callback-security';

@Controller('social/meta')
export class InstagramLifecycleController{
 constructor(private readonly db:PrismaService){}
 /** Meta signed callbacks cannot require an active SaaS session or a browser Origin header. */
 private async revoke(body:unknown):Promise<void>{
  const id=signedInstagramUser(body);
  // Restrict to accounts linked through THIS Instagram Login app. A Facebook Page
  // access token for the same IG user is not authorized by the Instagram signature.
  const rows=await this.db.socialConnection.findMany({where:{
   platform:'instagram',externalAccountId:id,mode:'OFFICIAL',encryptedCredentials:{not:null},
  },select:{id:true,encryptedCredentials:true}});
  const ids=rows.filter(row=>{
   try{
    return unseal<{loginType?:string}>(row.encryptedCredentials!).loginType==='instagram';
   }catch{
    // An unreadable/rotated ciphertext must not retain customer credentials
    // when Meta asks us to erase the matching Instagram account.
    return true;
   }
  }).map(row=>row.id);
  if(ids.length)await this.db.socialConnection.updateMany({where:{id:{in:ids}},
   data:{state:'DISCONNECTED',encryptedCredentials:null,externalAccountName:null,
    externalAccountId:null,tokenExpiresAt:null,tokenScopes:[],connectedAt:null,
    lastHealthReason:null,lastHealthCheckedAt:null,pausedAt:new Date()}});
 }
 @Post('deauthorize')
 async deauthorize(@Body() body:unknown){await this.revoke(body);return {success:true};}
 @Post('data-deletion')
 async deletion(@Body() body:unknown){
  await this.revoke(body);
  const confirmation_code=deletionReceipt();
  const origin=new URL(process.env.INSTAGRAM_REDIRECT_URI||'https://socials.businessos.af/').origin;
  const url=new URL('/api/v1/social/meta/data-deletion/status',origin);
  url.searchParams.set('code',confirmation_code);
  return {url:url.toString(),confirmation_code};
 }
 @Get('data-deletion/status')
 status(@Query('code')code?:string){
  if(!code||!validDeletionReceipt(code))throw new BadRequestException('Invalid or expired deletion receipt');
  return {status:'completed',confirmation_code:code};
 }
}
