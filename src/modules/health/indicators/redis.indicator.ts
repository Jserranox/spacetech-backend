import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import type Redis from 'ioredis';

export const HEALTH_REDIS_CLIENT = 'HEALTH_REDIS_CLIENT';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(HEALTH_REDIS_CLIENT)
    private readonly redis: Redis,
  ) {
    super();
  }

  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        const result = this.getStatus(key, false, {
          message: `Unexpected response: ${pong}`,
        });
        throw new HealthCheckError('Redis check failed', result);
      }
      return this.getStatus(key, true, { message: 'PONG' });
    } catch (err) {
      if (err instanceof HealthCheckError) throw err;
      const result = this.getStatus(key, false, {
        message: err instanceof Error ? err.message : 'unreachable',
      });
      throw new HealthCheckError('Redis check failed', result);
    }
  }
}
