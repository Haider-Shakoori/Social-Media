import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; service: string; timestamp: string } {
    return { status: 'ok', service: 'social-api', timestamp: new Date().toISOString() };
  }
}
