import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {BillingModule} from '../billing/billing.module';
import {AccessService} from '../tenants/access.service';
import {CreativeController} from './creative.controller';
import {CreativeService} from './creative.service';
@Module({imports:[SecurityModule,BillingModule],providers:[AccessService,CreativeService],controllers:[CreativeController]})
export class CreativeModule{}
