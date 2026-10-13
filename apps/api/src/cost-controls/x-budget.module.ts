import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {XBudgetService} from './x-budget.service';
import {XBudgetController} from './x-budget.controller';
@Module({imports:[SecurityModule],controllers:[XBudgetController],providers:[XBudgetService,AccessService]})
export class XBudgetModule{}
