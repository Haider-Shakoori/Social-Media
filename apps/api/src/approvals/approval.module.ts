import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {AccessService} from '../tenants/access.service';import {MailService} from '../security/mail.service';import {ApprovalController} from './approval.controller';import {ApprovalService} from './approval.service';
@Module({imports:[SecurityModule],providers:[AccessService,MailService,ApprovalService],controllers:[ApprovalController],exports:[ApprovalService]})
export class ApprovalModule{}
