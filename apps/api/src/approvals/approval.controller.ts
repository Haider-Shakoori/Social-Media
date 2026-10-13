import {Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';import {validated} from '../security/dto';
import {ApprovalService} from './approval.service';
const requestInput=z.strictObject({postId:z.uuid(),expiresHours:z.number().int().min(1).max(168).default(72)});
const reviewInput=z.strictObject({decision:z.enum(['APPROVED','REJECTED']),note:z.string().trim().max(500).default('')});
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/approvals')@UseGuards(AuthGuard)
export class ApprovalController{
 constructor(private readonly svc:ApprovalService){}
 @Get()list(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string){return this.svc.list(t,w,b,r.authUserId);}
 @Post()request(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Body() body:unknown){
  return this.svc.request(t,w,b,r.authUserId,validated(requestInput,body));
 }
 @Post(':id/decision')review(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
  return this.svc.review(t,w,b,r.authUserId,id,validated(reviewInput,body));
 }
}
