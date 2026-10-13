import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {PreflightController} from './preflight.controller';import {PreflightService} from './preflight.service';
import {AccessService} from '../tenants/access.service';
@Module({imports:[SecurityModule],controllers:[PreflightController],providers:[PreflightService,AccessService],exports:[PreflightService]})
export class PreflightModule{}
