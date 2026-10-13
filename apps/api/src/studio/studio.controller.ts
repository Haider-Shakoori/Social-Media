import {Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';
import {StudioService} from './studio.service';
import {contentInput,versionInput,campaignInput,mediaInput} from './studio.dto';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/studio')
@UseGuards(AuthGuard)
export class StudioController{
 constructor(private readonly service:StudioService){}
 @Get()
 list(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string){
  return this.service.list(t,w,b,req.authUserId);
 }
 @Post('posts')
 post(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Body() body:unknown){
  return this.service.create(t,w,b,req.authUserId,validated(contentInput,body));
 }
 @Post('posts/:id/versions')
 revise(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.service.revise(t,w,b,req.authUserId,id,validated(versionInput,body));
 }
 @Post('campaigns')
 campaign(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Body() body:unknown){
  return this.service.campaigns(t,w,b,req.authUserId,validated(campaignInput,body));
 }
 @Post('media')
 media(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Body() body:unknown){
  return this.service.media(t,w,b,req.authUserId,validated(mediaInput,body));
 }
}
