import {Controller,Get,Param,ParseUUIDPipe,Query,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {EvidenceService} from './evidence.service';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/evidence')@UseGuards(AuthGuard)
export class EvidenceController{
 constructor(private readonly service:EvidenceService){}
 @Get('report')
 report(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,
  @Param('brandId',new ParseUUIDPipe()) b:string,@Query('days') raw?:string){
  const days=validated(z.coerce.number().int().refine(n=>[7,30,90].includes(n)),raw??'30');
  return this.service.report(t,w,b,req.authUserId,days);
 }
}
