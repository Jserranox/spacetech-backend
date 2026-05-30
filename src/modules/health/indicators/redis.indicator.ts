import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import Redis from 'ioredis';
import { HEALTH_REDIS_CLIENT } from '../health.constants';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    @Inject(HEALTH_REDIS_CLIENT) private readonly redis: Redis,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return this.healthIndicatorService.check(key).down({
          message: `Unexpected response: ${pong}`,
        });
      }
      return this.healthIndicatorService.check(key).up({ message: pong });
    } catch (err) {
      return this.healthIndicatorService.check(key).down({ message: (err as Error).message });
    }
  }
}
