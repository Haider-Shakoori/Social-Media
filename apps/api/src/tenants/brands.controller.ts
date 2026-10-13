import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard,type AuthRequest } from '../security/auth.guard';
import { validated,brandInput,brandPatchInput,grantBrandAccessInput } from '../security/dto';
import { BrandsService } from './brands.service';

@Controller('tenants/:tenantId/workspaces/:workspaceId/brands')
@UseGuards(AuthGuard)
export class BrandsController {
  constructor(private readonly service:BrandsService){}
  @Get()
  list(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string){
    return this.service.list(req.authUserId,tenantId,workspaceId);
  }
  @Post()
  create(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Body() data:unknown){
    return this.service.create(req.authUserId,tenantId,workspaceId,validated(brandInput,data));
  }
  @Patch(':brandId')
  update(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Body() data:unknown){
    return this.service.update(req.authUserId,tenantId,workspaceId,brandId,validated(brandPatchInput,data));
  }
  @Delete(':brandId')
  archive(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string){
    return this.service.archive(req.authUserId,tenantId,workspaceId,brandId);
  }
  @Get(':brandId/members')
  members(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string){
    return this.service.listAccess(req.authUserId,tenantId,workspaceId,brandId);
  }
  @Put(':brandId/members')
  grant(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Body() data:unknown){
    const input=validated(grantBrandAccessInput,data);
    return this.service.grant(req.authUserId,tenantId,workspaceId,brandId,input.userId,input.role);
  }
  @Delete(':brandId/members/:userId')
  revoke(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,@Param('brandId',new ParseUUIDPipe()) brandId:string,@Param('userId',new ParseUUIDPipe()) userId:string){
    return this.service.revoke(req.authUserId,tenantId,workspaceId,brandId,userId);
  }
}
