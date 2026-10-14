import {BadRequestException,Body,Controller,Get,Param,ParseUUIDPipe,Post,Query,Req,Res,UseGuards} from '@nestjs/common';
import type {Response} from 'express';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';
import {attemptId,chosenAccount,oauthNetwork} from './oauth.dto';
import {OAuthService} from './oauth.service';

@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/social')
@UseGuards(AuthGuard)
export class BrandSocialOAuthController{
 constructor(private readonly service:OAuthService){}
 @Get('readiness')
 readiness(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string){
  return this.service.readiness(req.authUserId,tenantId,workspaceId,brandId);
 }
 @Post('oauth/:network/start')
 start(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,
  @Param('network')network:string){
  return this.service.start(req.authUserId,req.authSessionId,tenantId,workspaceId,brandId,validated(oauthNetwork,network));
 }
 @Post('accounts/:id/health-check')
 health(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,
  @Param('id',new ParseUUIDPipe()) id:string){
  return this.service.checkAccount(req.authUserId,tenantId,workspaceId,brandId,id);
 }
 @Post('accounts/:id/refresh')
 refresh(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,
  @Param('id',new ParseUUIDPipe()) id:string){
  return this.service.refreshAccount(req.authUserId,tenantId,workspaceId,brandId,id);
 }
 @Post('accounts/:id/disconnect')
 disconnect(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,
  @Param('id',new ParseUUIDPipe()) id:string){
  return this.service.disconnect(req.authUserId,tenantId,workspaceId,brandId,id);
 }
}
@Controller('social/oauth')
@UseGuards(AuthGuard)
export class OAuthCallbacksController{
 constructor(private readonly service:OAuthService){}
 @Get(':network/callback')
 async callback(@Req() req:AuthRequest,@Res() res:Response,
  @Param('network')network:string,@Query('code')code?:string,@Query('state')state?:string,@Query('error')error?:string){
  if(error||!code||!state){res.redirect(303,this.service.dashboardRedirect({failure:'authorization_cancelled'}));return;}
  try{
   const result=await this.service.callback(req.authUserId,req.authSessionId,network,code,state);
   res.redirect(303,this.service.dashboardRedirect(result));
  }catch{
   // Never expose OAuth codes, state or upstream error data to browser redirects.
   res.redirect(303,this.service.dashboardRedirect({failure:'authorization_failed'}));
  }
 }
 @Get('attempts/:id/accounts')
 accounts(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string){
  return this.service.accounts(req.authUserId,req.authSessionId,id);
 }
 @Post('attempts/:id/select')
 choose(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  const a=validated(chosenAccount,body);
  return this.service.choose(req.authUserId,req.authSessionId,id,a.accountId,a.platform);
 }
}
