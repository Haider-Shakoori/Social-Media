import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {EvidenceController} from './evidence.controller';
import {EvidenceService} from './evidence.service';
@Module({imports:[SecurityModule],controllers:[EvidenceController],providers:[EvidenceService,AccessService]})
export class EvidenceModule{}
