import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {AnalyticsController} from './analytics.controller';
import {AnalyticsService} from './analytics.service';
@Module({imports:[SecurityModule],controllers:[AnalyticsController],providers:[AccessService,AnalyticsService]})
export class AnalyticsModule{}
