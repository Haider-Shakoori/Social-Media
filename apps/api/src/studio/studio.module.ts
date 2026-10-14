import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';
import {StudioService} from './studio.service';
import {StudioController} from './studio.controller';
import {MediaUploadController} from './media-upload.controller';
import {MediaUploadService} from './media-upload.service';
@Module({imports:[SecurityModule],providers:[StudioService,AccessService,MediaUploadService],controllers:[StudioController,MediaUploadController],exports:[StudioService]})
export class StudioModule{}
