import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {AgencyController} from './agency.controller';
import {AgencyService} from './agency.service';
@Module({imports:[SecurityModule],controllers:[AgencyController],providers:[AgencyService,AccessService]})
export class AgencyModule{}
