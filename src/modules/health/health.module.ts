import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import Redis from 'ioredis';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { HealthController } from './controllers/health.controller';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { LlmHealthIndicator } from './indicators/llm.indicator';
import {
  HEALTH_REDIS_CLIENT,
  RedisHealthIndicator,
} from './indicators/redis.indicator';
import { StorageHealthIndicator } from './indicators/storage.indicator';

@Module({
  imports: [
    TerminusModule.forRoot({ errorLogStyle: 'pretty' }),
    KnowledgeModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: HEALTH_REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379')),
    },
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
    LlmHealthIndicator,
  ],
})
export class HealthModule {}
