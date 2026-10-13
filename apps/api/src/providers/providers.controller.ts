import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post,Req,UseGuards} from '@nestjs/common';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {PlatformGuard} from '../billing/platform.guard';
import {validated} from '../security/dto';
import {manualExportInput,policyUpdateInput} from './providers.dto';
import {ProvidersService} from './providers.service';

@Controller('tenants/:tenantId/providers')
@UseGuards(AuthGuard)
export class TenantProvidersController {
 constructor(private readonly service:ProvidersService){}
 @Get()
 list(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) id:string){
  return this.service.tenantCatalog(req.authUserId,id);
 }
 @Get('workspaces/:workspaceId/brands/:brandId')
 brand(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string){
  return this.service.brandCatalog(req.authUserId,tenantId,workspaceId,brandId);
 }
 @Post('workspaces/:workspaceId/brands/:brandId/manual-package')
 exportManual(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,
  @Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Body() body:unknown){
  return this.service.manualPackage(req.authUserId,tenantId,workspaceId,brandId,validated(manualExportInput,body));
 }
}
@Controller('platform/providers')
@UseGuards(AuthGuard,PlatformGuard)
export class PlatformProvidersController{
 constructor(private readonly service:ProvidersService){}
 @Get() list(){return this.service.operatorList();}
 @Patch(':network') update(@Req() req:AuthRequest,@Param('network') network:string,@Body() body:unknown){
  return this.service.updateOperator(req.authUserId,network,validated(policyUpdateInput,body));
 }
}
