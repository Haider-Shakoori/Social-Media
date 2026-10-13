import {Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';import {validated} from '../security/dto';
import {ProtectionService} from './protection.service';
const input=z.strictObject({paused:z.boolean(),reason:z.string().trim().min(5).max(300)});
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/protection')@UseGuards(AuthGuard)
export class ProtectionController{
 constructor(private readonly svc:ProtectionService){}
 @Get()get(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string){
  return this.svc.get(t,w,b,req.authUserId);
 }
 @Post('pause')pause(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Body() body:unknown){
  return this.svc.pause(t,w,b,req.authUserId,validated(input,body));
 }
 @Post('connections/:id/restrict')restrict(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Param('id',new ParseUUIDPipe()) id:string){
  return this.svc.restrict(t,w,b,req.authUserId,id);
 }
}
