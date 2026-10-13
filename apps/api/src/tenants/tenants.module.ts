import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { BillingModule } from '../billing/billing.module';
import { MailService } from '../security/mail.service';
import { AccessService } from './access.service';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
@Module({
  imports:[SecurityModule,BillingModule],
  controllers:[TenantsController,BrandsController,InvitationsController],
  providers:[TenantsService,AccessService,BrandsService,InvitationsService,MailService],
})
export class TenantsModule {}
