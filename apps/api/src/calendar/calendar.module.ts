import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {BillingModule} from '../billing/billing.module';
import {AccessService} from '../tenants/access.service';
import {CalendarController} from './calendar.controller';
import {CalendarService} from './calendar.service';
@Module({imports:[SecurityModule,BillingModule],providers:[AccessService,CalendarService],controllers:[CalendarController],exports:[CalendarService]})
export class CalendarModule{}
