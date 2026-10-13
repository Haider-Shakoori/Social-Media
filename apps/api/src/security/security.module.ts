import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RateLimiterService } from './rate-limiter.service';
@Module({providers:[AuthGuard,RateLimiterService],exports:[AuthGuard,RateLimiterService]})
export class SecurityModule {}
