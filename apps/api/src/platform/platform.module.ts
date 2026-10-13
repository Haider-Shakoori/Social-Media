import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {PlatformGuard} from '../billing/platform.guard';
import {PlatformController,PublicCmsController} from './platform.controller';
import {PlatformService} from './platform.service';
@Module({imports:[SecurityModule],providers:[PlatformService,PlatformGuard],controllers:[PlatformController,PublicCmsController]})
export class PlatformModule {}
