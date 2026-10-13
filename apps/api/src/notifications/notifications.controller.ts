import {Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';import {NotificationsService} from './notifications.service';
@Controller('notifications')@UseGuards(AuthGuard)
export class NotificationsController{
 constructor(private readonly svc:NotificationsService){}
 @Get()inbox(@Req() req:AuthRequest){return this.svc.inbox(req.authUserId);}
 @Patch('preferences')preference(@Req() req:AuthRequest,@Body() body:unknown){
  return this.svc.preference(req.authUserId,validated(z.strictObject({emailOptIn:z.boolean()}),body).emailOptIn);
 }
 @Post(':id/read')read(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string){return this.svc.read(req.authUserId,id);}
 @Post(':id/email')email(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string){return this.svc.sendMyEmail(req.authUserId,id);}
}
