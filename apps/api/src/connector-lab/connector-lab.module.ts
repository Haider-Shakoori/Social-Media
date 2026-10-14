import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {PlatformGuard} from '../billing/platform.guard';
import {ConnectorLabService} from './connector-lab.service';
import {ConnectorLabAgentGuard} from './connector-lab.guard';
import {ConnectorLabAdminController,ConnectorLabAgentController} from './connector-lab.controller';
@Module({imports:[SecurityModule],
 providers:[ConnectorLabService,PlatformGuard,ConnectorLabAgentGuard],
 controllers:[ConnectorLabAdminController,ConnectorLabAgentController]})
export class ConnectorLabModule{}
