import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from '../security/mail.service';
import { SecurityModule } from '../security/security.module';
@Module({imports:[SecurityModule],controllers:[AuthController],providers:[AuthService,MailService]})
export class AuthModule {}
