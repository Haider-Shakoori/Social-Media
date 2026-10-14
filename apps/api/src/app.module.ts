import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RequestSecurityMiddleware } from './security/request-security';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { BillingModule } from './billing/billing.module';
import { PlatformModule } from './platform/platform.module';
import { ProvidersModule } from './providers/providers.module';
import { OAuthModule } from './social-oauth/oauth.module';
import { CreativeModule } from './creative/creative.module';
import { StudioModule } from './studio/studio.module';
import { CalendarModule } from './calendar/calendar.module';
import { ApprovalModule } from './approvals/approval.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ProtectionModule } from './protection/protection.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PublishingModule } from './publishing/publishing.module';
@Module({
  imports:[PrismaModule,AuthModule,BillingModule,TenantsModule,PlatformModule,ProvidersModule,OAuthModule,CreativeModule,StudioModule,CalendarModule,ApprovalModule,NotificationsModule,SchedulerModule,ProtectionModule,AnalyticsModule,PublishingModule],
  controllers:[HealthController],
})
export class AppModule implements NestModule {
  configure(consumer:MiddlewareConsumer):void {
    consumer.apply(RequestSecurityMiddleware).forRoutes('*');
  }
}
