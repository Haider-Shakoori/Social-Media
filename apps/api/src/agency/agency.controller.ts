import {Controller,Get,Param,ParseUUIDPipe,Query,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {AgencyService} from './agency.service';
@Controller('tenants/:tenantId/agency')@UseGuards(AuthGuard)
export class AgencyController{
 constructor(private readonly svc:AgencyService){}
 @Get('overview')overview(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string){
  return this.svc.overview(id,req.authUserId);
 }
 @Get('workspaces/:workspaceId/brands/:brandId/report')report(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Query('days') days?:string){
  return this.svc.clientReport(tenantId,workspaceId,brandId,req.authUserId,
   validated(z.coerce.number().int().refine(v=>[7,30,90].includes(v)),days??'30'));
 }
}
