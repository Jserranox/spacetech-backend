import { Module } from '@nestjs/common';
import { BotsController } from './controllers/bots.controller';
import { BotsService } from './services/bots.service';
import { BotConfigService } from './services/bot-config.service';
import { BotCacheService } from './services/bot-cache.service';

@Module({
  controllers: [BotsController],
  providers: [BotsService, BotConfigService, BotCacheService]
})
export class BotsModule {}
