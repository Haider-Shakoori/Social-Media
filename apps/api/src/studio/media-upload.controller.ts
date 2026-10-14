import {Body,Controller,Get,Param,ParseUUIDPipe,Post,Req,UseGuards} from '@nestjs/common';
import {z} from 'zod';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {validated} from '../security/dto';
import {MediaUploadService} from './media-upload.service';

const startSchema=z.strictObject({
 fileName:z.string().min(1).max(180),mimeType:z.enum(['image/jpeg','image/png']),
 sizeBytes:z.number().int().positive().max(8*1024*1024),
});
const completeSchema=z.strictObject({confirmation:z.string().min(20).max(1500),
 altText:z.string().trim().max(500).default('')});
@Controller('tenants/:tenantId/workspaces/:workspaceId/brands/:brandId/studio/media-upload')
@UseGuards(AuthGuard)
export class MediaUploadController{
 constructor(private readonly service:MediaUploadService){}
 @Get('config')
 config(@Req() r:AuthRequest){return this.service.config();}
 @Post('presign')
 presign(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,
  @Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,
  @Body() body:unknown){
  return this.service.presign(t,w,b,r.authUserId,validated(startSchema,body));
 }
 @Post('complete')
 complete(@Req() r:AuthRequest,@Param('tenantId',new ParseUUIDPipe()) t:string,
  @Param('workspaceId',new ParseUUIDPipe()) w:string,@Param('brandId',new ParseUUIDPipe()) b:string,
  @Body() body:unknown){
  return this.service.complete(t,w,b,r.authUserId,validated(completeSchema,body));
 }
}
