import {Controller,Get,UseGuards} from '@nestjs/common';
import {AuthGuard} from '../security/auth.guard';import {PlatformGuard} from '../billing/platform.guard';
import {LaunchService} from './launch.service';
@Controller('platform/launch')@UseGuards(AuthGuard,PlatformGuard)
export class LaunchController{
 constructor(private readonly service:LaunchService){}
 @Get('readiness')check(){return this.service.report();}
}
