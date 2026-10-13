import {Controller,Get,Param,ParseUUIDPipe,Query,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {PreflightService} from './preflight.service';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/publishing')@UseGuards(AuthGuard)
export class PreflightController{
 constructor(private readonly svc:PreflightService){}
 @Get('preflight/:network/:postId')
 check(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,
  @Param('brandId',new ParseUUIDPipe()) b:string,@Param('network') raw:string,@Param('postId',new ParseUUIDPipe()) postId:string,
  @Query('connectionId') rawConnection?:string){
  const network=validated(z.enum(['facebook','instagram','x']),raw);
  const connectionId=rawConnection?validated(z.uuid(),rawConnection):undefined;
  return this.svc.evaluate(t,w,b,req.authUserId,postId,network,connectionId);
 }
}
