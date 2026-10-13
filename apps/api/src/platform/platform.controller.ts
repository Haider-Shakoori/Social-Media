import {Body,Controller,Get,NotFoundException,Param,ParseUUIDPipe,Patch,Post,Query,Req,UseGuards} from '@nestjs/common';
import {AuthGuard,type AuthRequest} from '../security/auth.guard';
import {PlatformGuard} from '../billing/platform.guard';
import {validated} from '../security/dto';
import {cmsEntryInput,cmsEditInput,cmsRevisionInput,listCmsQuery,pageQuery,platformSettingInput} from './platform.dto';
import {PlatformService} from './platform.service';

@Controller('platform/operations')
@UseGuards(AuthGuard,PlatformGuard)
export class PlatformController {
  constructor(private readonly service:PlatformService){}
  @Get('overview')overview(){return this.service.overview();}
  @Get('users')users(@Query() q:unknown){return this.service.users(validated(pageQuery,q).page);}
  @Get('tenants')tenants(@Query() q:unknown){return this.service.tenants(validated(pageQuery,q).page);}
  @Get('audit')audit(@Query() q:unknown){return this.service.auditEvents(validated(pageQuery,q).page);}
  @Get('settings')settings(){return this.service.settings();}
  @Patch('settings')set(@Req() req:AuthRequest,@Body() body:unknown){
    const x=validated(platformSettingInput,body);
    return this.service.saveSetting(req.authUserId,x.key,x.value);
  }
  @Get('cms')entries(@Query() q:unknown){
    const x=validated(listCmsQuery,q);return this.service.listEntries(x.page,x.type,x.status,x.locale);
  }
  @Post('cms')create(@Req() req:AuthRequest,@Body() body:unknown){
    return this.service.createEntry(req.authUserId,validated(cmsEntryInput,body));
  }
  @Patch('cms/:id')edit(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
    const {expectedRevision,...data}=validated(cmsEditInput,body);
    return this.service.editEntry(req.authUserId,id,expectedRevision,data);
  }
  @Post('cms/:id/publish')publish(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
    return this.service.changeStatus(req.authUserId,id,validated(cmsRevisionInput,body).expectedRevision,'PUBLISHED');
  }
  @Post('cms/:id/unpublish')unpublish(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
    return this.service.changeStatus(req.authUserId,id,validated(cmsRevisionInput,body).expectedRevision,'DRAFT');
  }
  @Post('cms/:id/archive')archive(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string,@Body() body:unknown){
    return this.service.changeStatus(req.authUserId,id,validated(cmsRevisionInput,body).expectedRevision,'ARCHIVED');
  }
}
@Controller('cms/public')
export class PublicCmsController {
  constructor(private readonly service:PlatformService){}
  @Get(':type/:locale')
  list(@Param('type')type:string,@Param('locale')locale:string){
    const t=this.checkedType(type),l=this.checkedLocale(locale);
    return this.service.publicList(t,l);
  }
  @Get(':type/:locale/:slug')
  detail(@Param('type')type:string,@Param('locale')locale:string,@Param('slug')slug:string){
    const t=this.checkedType(type),l=this.checkedLocale(locale);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new NotFoundException();
    return this.service.publicDetail(t,l,slug);
  }
  private checkedType(value:string):'ARTICLE'|'GUIDE'|'PAGE'{
    if(value!=='ARTICLE'&&value!=='GUIDE'&&value!=='PAGE')throw new NotFoundException();
    return value;
  }
  private checkedLocale(value:string):string{
    if(!['en','fa-AF','ps','ar'].includes(value))throw new NotFoundException();
    return value;
  }
}
