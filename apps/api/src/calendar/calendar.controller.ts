import {BadRequestException,Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';
import {CalendarService} from './calendar.service';
export const slotInput=z.strictObject({
 postId:z.uuid(),network:z.enum(['facebook','instagram','x']),
 scheduledAt:z.iso.datetime({offset:true}),timezone:z.string().trim().min(3).max(100),
 repeat:z.enum(['once','daily','weekly']).default('once'),count:z.number().int().min(1).max(12).default(1),
});
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/calendar')
@UseGuards(AuthGuard)
export class CalendarController{
 constructor(private readonly svc:CalendarService){}
 @Get()list(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string){
  return this.svc.list(t,w,b,r.authUserId);
 }
 @Post()create(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Body() input:unknown){
  return this.svc.create(t,w,b,r.authUserId,validated(slotInput,input));
 }
 @Post(':id/cancel')cancel(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,@Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,@Param('id',new ParseUUIDPipe()) id:string){
  return this.svc.cancel(t,w,b,r.authUserId,id);
 }
}
