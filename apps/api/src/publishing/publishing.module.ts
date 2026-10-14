import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {BillingModule} from '../billing/billing.module';
import {AccessService} from '../tenants/access.service';
import {PublishingService} from './publishing.service';
import {PublishingController} from './publishing.controller';
@Module({imports:[SecurityModule,BillingModule],providers:[AccessService,PublishingService],
 controllers:[PublishingController]})
export class PublishingModule{}
