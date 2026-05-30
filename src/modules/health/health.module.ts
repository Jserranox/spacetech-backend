import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { KnowledgeModule } from '../knowledge/knowledge.module';
import { HEALTH_REDIS_CLIENT } from './health.constants';
import { HealthController } from './controllers/health.controller';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';
import { StorageHealthIndicator } from './indicators/storage.indicator';
import { LlmHealthIndicator } from './indicators/llm.indicator';

@Module({
  imports: [
    TerminusModule.forRoot({ errorLogStyle: 'pretty', gracefulShutdownTimeoutMs: 3000 }),
    KnowledgeModule,
  ],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
    LlmHealthIndicator,
    {
      provide: HEALTH_REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379')),
    },
  ],
})
export class HealthModule {}
