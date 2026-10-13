import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {BillingController,PlatformBillingController} from './billing.controller';
import {BillingService} from './billing.service';
import {EntitlementsService} from './entitlements.service';
import {PlatformGuard} from './platform.guard';
@Module({imports:[SecurityModule],providers:[BillingService,EntitlementsService,PlatformGuard],
 controllers:[BillingController,PlatformBillingController],exports:[EntitlementsService]})
export class BillingModule{}
