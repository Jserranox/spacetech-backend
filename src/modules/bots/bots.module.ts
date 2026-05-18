import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Bot } from '@aero-agent/database';
import Redis from 'ioredis';

import { BotsController } from './controllers/bots.controller';
import { BotsService } from './services/bots.service';
import { BotConfigService } from './services/bot-config.service';
import { BotCacheService } from './services/bot-cache.service';
import { TenantsModule } from '../tenants/tenants.module';
import { BOTS_REDIS_CLIENT } from './bots.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bot]),
    TenantsModule,
  ],
  controllers: [BotsController],
  providers: [
    BotsService,
    BotConfigService,
    BotCacheService,
    {
      provide: BOTS_REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379')),
    },
  ],
  exports: [BotsService, BotConfigService],
})
export class BotsModule {}
