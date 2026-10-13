import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {PlatformGuard} from '../billing/platform.guard';import {LaunchController} from './launch.controller';
import {LaunchService} from './launch.service';
@Module({imports:[SecurityModule],controllers:[LaunchController],providers:[LaunchService,PlatformGuard]})
export class LaunchModule{}
