import {Controller,Post,UseGuards} from '@nestjs/common';
import {AuthGuard} from '../security/auth.guard';import {PlatformGuard} from '../billing/platform.guard';
import {SchedulerService} from './scheduler.service';
@Controller('platform/manual-scheduler')@UseGuards(AuthGuard,PlatformGuard)
export class SchedulerController{
 constructor(private readonly svc:SchedulerService){}
 @Post('run')run(){return this.svc.runOnce();}
}
