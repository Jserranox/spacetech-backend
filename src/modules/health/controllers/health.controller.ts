import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Public } from '../../auth/decorators/public.decorator';
import { DatabaseHealthIndicator } from '../indicators/database.indicator';
import { LlmHealthIndicator } from '../indicators/llm.indicator';
import { RedisHealthIndicator } from '../indicators/redis.indicator';
import { StorageHealthIndicator } from '../indicators/storage.indicator';

@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly dbIndicator: DatabaseHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly storageIndicator: StorageHealthIndicator,
    private readonly llmIndicator: LlmHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.dbIndicator.isHealthy('database'),
      () => this.redisIndicator.isHealthy('redis'),
      async (): Promise<HealthIndicatorResult> => {
        try {
          return await this.storageIndicator.isHealthy('storage');
        } catch {
          return {
            storage: {
              status: 'up' as const,
              degraded: true,
              message: 'unavailable',
            },
          };
        }
      },
      async (): Promise<HealthIndicatorResult> => {
        try {
          return await this.llmIndicator.isHealthy('llm');
        } catch {
          return {
            llm: {
              status: 'up' as const,
              degraded: true,
              message: 'unavailable',
            },
          };
        }
      },
    ]);
  }
}
