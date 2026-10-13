import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthRequest } from '../security/auth.guard';
import {validated,tenantInput,workspaceInput,roleInput} from '../security/dto';
import { TenantsService } from './tenants.service';
@Controller('tenants') @UseGuards(AuthGuard)
export class TenantsController{
  constructor(private readonly tenants:TenantsService){}
  @Get() list(@Req() req:AuthRequest){return this.tenants.list(req.authUserId);}
  @Post() create(@Req() req:AuthRequest,@Body() body:unknown){
    const input=validated(tenantInput,body);return this.tenants.create(req.authUserId,input.name,input.slug);
  }
  @Get(':tenantId/workspaces')
  workspaces(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string){
    return this.tenants.listWorkspaces(req.authUserId,tenantId);
  }
  @Post(':tenantId/workspaces')
  createWorkspace(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Body() body:unknown){
    const input=validated(workspaceInput,body);
    return this.tenants.createWorkspace(req.authUserId,tenantId,input.name,input.timezone);
  }
  @Get(':tenantId/members')
  members(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string){
    return this.tenants.listMembers(req.authUserId,tenantId);
  }
  @Patch(':tenantId/members/:userId')
  changeRole(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('userId',new ParseUUIDPipe()) userId:string,@Body() body:unknown){
    return this.tenants.updateRole(req.authUserId,tenantId,userId,validated(roleInput,body).role);
  }
}
