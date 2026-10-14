import {Module} from '@nestjs/common';
import {SecurityModule} from '../security/security.module';
import {BillingModule} from '../billing/billing.module';
import {OAuthService} from './oauth.service';
import {MetaHealthMonitor} from './meta-health-monitor';
import {BrandSocialOAuthController,OAuthCallbacksController} from './oauth.controller';
import {InstagramLifecycleController} from './instagram-callbacks.controller';
@Module({imports:[SecurityModule,BillingModule],providers:[OAuthService,MetaHealthMonitor],
 controllers:[BrandSocialOAuthController,OAuthCallbacksController,InstagramLifecycleController]})
export class OAuthModule {}
