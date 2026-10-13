import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {PreflightModule} from '../preflight/preflight.module';
import {XPilotController} from './x.controller';import {XPilotService} from './x.service';
@Module({imports:[SecurityModule,PreflightModule],controllers:[XPilotController],providers:[XPilotService,AccessService]})
export class XPilotModule{}
