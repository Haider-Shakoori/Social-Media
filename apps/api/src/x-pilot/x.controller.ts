import {Controller,Get,Param,ParseUUIDPipe,Query,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {XPilotService} from './x.service';
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/x')@UseGuards(AuthGuard)
export class XPilotController{
 constructor(private readonly service:XPilotService){}
 @Get('preview/:postId')preview(@Req() req:AuthRequest,
  @Param('tenantId',new ParseUUIDPipe()) tenantId:string,@Param('workspaceId',new ParseUUIDPipe()) workspaceId:string,
  @Param('brandId',new ParseUUIDPipe()) brandId:string,@Param('postId',new ParseUUIDPipe()) postId:string,
  @Query('connectionId') raw?:string){
   return this.service.preview(tenantId,workspaceId,brandId,req.authUserId,postId,
    raw?validated(z.uuid(),raw):undefined);
  }
}
