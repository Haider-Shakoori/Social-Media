import {Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {RehearsalService} from './rehearsal.service';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/rehearsals')@UseGuards(AuthGuard)
export class RehearsalController{
 constructor(private readonly svc:RehearsalService){}
 @Get()list(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string){
  return this.svc.list(t,w,b,req.authUserId);
 }
 @Post('posts/:postId')
 create(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,
  @Param('brandId',new ParseUUIDPipe()) b:string,@Param('postId',new ParseUUIDPipe()) postId:string,@Body() body:unknown){
  const input=validated(z.strictObject({network:z.enum(['facebook','instagram','x']),requestKey:z.uuid()}),body);
  return this.svc.create(t,w,b,req.authUserId,postId,input.network,input.requestKey);
 }
}
