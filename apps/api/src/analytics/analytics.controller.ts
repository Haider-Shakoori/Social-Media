import {Controller,Get,Param,ParseUUIDPipe,Query,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {AnalyticsService} from './analytics.service';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/analytics')@UseGuards(AuthGuard)
export class AnalyticsController{
 constructor(private readonly svc:AnalyticsService){}
 @Get()
 get(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Query('days') days:unknown){
  const parsed=validated(z.coerce.number().int().refine(v=>[7,30,90].includes(v)),days??30);
  return this.svc.summary(tenantId,workspaceId,brandId,req.authUserId,parsed);
 }
}
