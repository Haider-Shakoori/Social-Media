import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {ProtectionController} from './protection.controller';
import {ProtectionService} from './protection.service';
@Module({imports:[SecurityModule],providers:[AccessService,ProtectionService],controllers:[ProtectionController]})
export class ProtectionModule{}
