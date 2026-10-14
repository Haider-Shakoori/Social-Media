import {Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';
import {PublishingService} from './publishing.service';
const request=z.strictObject({postId:z.uuid(),connectionId:z.uuid(),scheduledAt:z.iso.datetime().optional()});
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/publishing')
@UseGuards(AuthGuard)
export class PublishingController{
 constructor(private readonly publishing:PublishingService){}
 @Get('targets')
 list(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,
  @Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string){
  return this.publishing.list(t,w,b,r.authUserId);
 }
 @Post('targets')
 queue(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,
  @Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,
  @Body() body:unknown){
  return this.publishing.queue(t,w,b,r.authUserId,validated(request,body));
 }
}
