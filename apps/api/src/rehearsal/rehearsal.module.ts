import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {PreflightModule} from '../preflight/preflight.module';
import {RehearsalService} from './rehearsal.service';import {RehearsalController} from './rehearsal.controller';
@Module({imports:[SecurityModule,PreflightModule],controllers:[RehearsalController],
 providers:[AccessService,RehearsalService]})
export class RehearsalModule{}
