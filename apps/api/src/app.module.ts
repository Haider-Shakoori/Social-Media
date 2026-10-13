import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RequestSecurityMiddleware } from './security/request-security';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { BillingModule } from './billing/billing.module';
import { PlatformModule } from './platform/platform.module';
@Module({
  imports:[PrismaModule,AuthModule,BillingModule,TenantsModule,PlatformModule],
  controllers:[HealthController],
})
export class AppModule implements NestModule {
  configure(consumer:MiddlewareConsumer):void {
    consumer.apply(RequestSecurityMiddleware).forRoutes('*');
  }
}
