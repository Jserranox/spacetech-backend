import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../../auth/decorators/public.decorator';
import { DatabaseHealthIndicator } from '../indicators/database.indicator';
import { RedisHealthIndicator } from '../indicators/redis.indicator';
import { StorageHealthIndicator } from '../indicators/storage.indicator';
import { LlmHealthIndicator } from '../indicators/llm.indicator';

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
    // Verifies only that the Node process responds — always 200.
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      // Critical: DB or Redis down → 503
      () => this.dbIndicator.isHealthy('database'),
      () => this.redisIndicator.isHealthy('redis'),
      // Non-critical: failures surfaced in metadata but never cause 503
      async () => {
        try {
          return await this.storageIndicator.isHealthy('storage');
        } catch {
          return { storage: { status: 'up' as const, available: false, message: 'unavailable' } };
        }
      },
      async () => {
        try {
          return await this.llmIndicator.isHealthy('llm');
        } catch {
          return { llm: { status: 'up' as const, available: false, message: 'unavailable' } };
        }
      },
    ]);
  }
}
