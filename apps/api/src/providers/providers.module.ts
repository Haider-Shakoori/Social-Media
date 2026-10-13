import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {PlatformGuard} from '../billing/platform.guard';
import {ProvidersService} from './providers.service';
import {PlatformProvidersController,TenantProvidersController} from './providers.controller';
@Module({imports:[SecurityModule],controllers:[PlatformProvidersController,TenantProvidersController],
 providers:[ProvidersService,PlatformGuard]})
export class ProvidersModule{}
