import {Body,Controller,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';
import {creativeInput,imageInput} from './creative.dto';
import {CreativeService} from './creative.service';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/creative')
@UseGuards(AuthGuard)
export class CreativeController{
 constructor(private readonly service:CreativeService){}
 private ids(user:AuthRequest,tenantId:string,workspaceId:string,brandId:string){
  return {userId:user.authUserId,tenantId,workspaceId,brandId};
 }
 @Post('templates')
 templates(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Body() body:unknown){
  return this.service.templates(tenantId,workspaceId,brandId,req.authUserId,validated(creativeInput,body));
 }
 @Post('text')
 text(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Body() body:unknown){
  return this.service.generate(tenantId,workspaceId,brandId,req.authUserId,validated(creativeInput,body));
 }
 @Post('card')
 card(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Body() body:unknown){
  return this.service.brandCard(tenantId,workspaceId,brandId,req.authUserId,validated(imageInput,body));
 }
}
