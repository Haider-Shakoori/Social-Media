import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard,type AuthRequest } from '../security/auth.guard';
import { validated,memberInvitationInput,inviteAcceptanceInput } from '../security/dto';
import { InvitationsService } from './invitations.service';

@Controller() @UseGuards(AuthGuard)
export class InvitationsController {
  constructor(private readonly invitations:InvitationsService){}
  @Post('tenants/:tenantId/invitations')
  create(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Body() body:unknown){
    const {email,role}=validated(memberInvitationInput,body);
    return this.invitations.create(req.authUserId,tenantId,email,role);
  }
  @Get('tenants/:tenantId/invitations')
  list(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string){
    return this.invitations.list(req.authUserId,tenantId);
  }
  @Delete('tenants/:tenantId/invitations/:invitationId')
  revoke(@Req() req:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('invitationId',new ParseUUIDPipe()) invitationId:string){
    return this.invitations.revoke(req.authUserId,tenantId,invitationId);
  }
  @Post('invitations/accept')
  accept(@Req() req:AuthRequest,@Body() body:unknown){
    return this.invitations.accept(req.authUserId,validated(inviteAcceptanceInput,body).token);
  }
}
