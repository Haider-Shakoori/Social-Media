import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
@Module({imports:[SecurityModule],controllers:[TenantsController],providers:[TenantsService]})
export class TenantsModule {}
