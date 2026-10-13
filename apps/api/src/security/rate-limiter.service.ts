import { Injectable, OnModuleDestroy, OnModuleInit, ServiceUnavailableException, TooManyRequestsException } from '@nestjs/common';
import Redis from 'ioredis';
import { hashToken } from './crypto';
@Injectable()
export class RateLimiterService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | undefined;
  async onModuleInit(): Promise<void> {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error('REDIS_URL is required for distributed auth rate limiting');
    this.client = new Redis(url, {maxRetriesPerRequest:1, enableReadyCheck:true, lazyConnect:true, retryStrategy:()=>null});
    await this.client.connect();
  }
  async onModuleDestroy(): Promise<void> { if(this.client) await this.client.quit().catch(()=>this.client?.disconnect()); }
  async check(action:string, key:string, allowed:number, seconds:number): Promise<void> {
    try {
      if(!this.client) throw new Error('Redis rate limiter not initialized');
      const scoped = 'social:auth:limit:' + action + ':' + hashToken(key);
      const count = await this.client.incr(scoped);
      if(count===1) await this.client.expire(scoped,seconds);
      if(count>allowed) throw new TooManyRequestsException('Too many requests; try again later');
    } catch(error) {
      if(error instanceof TooManyRequestsException) throw error;
      throw new ServiceUnavailableException('Authentication protections temporarily unavailable');
    }
  }
}
