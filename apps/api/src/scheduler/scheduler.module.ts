import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {PlatformGuard} from '../billing/platform.guard';
import {SchedulerController} from './scheduler.controller';import {SchedulerService} from './scheduler.service';
@Module({imports:[SecurityModule],providers:[SchedulerService,PlatformGuard],controllers:[SchedulerController]})
export class SchedulerModule{}
