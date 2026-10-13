import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';
import {StudioService} from './studio.service';
import {StudioController} from './studio.controller';
@Module({imports:[SecurityModule],providers:[StudioService,AccessService],controllers:[StudioController],exports:[StudioService]})
export class StudioModule{}
