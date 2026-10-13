import {Module} from '@nestjs/common';import {SecurityModule} from '../security/security.module';
import {NotificationsService} from './notifications.service';import {NotificationsController} from './notifications.controller';
import {MailService} from '../security/mail.service';
@Module({imports:[SecurityModule],providers:[NotificationsService,MailService],controllers:[NotificationsController],exports:[NotificationsService]})
export class NotificationsModule{}
