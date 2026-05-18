import { Injectable, Inject } from '@nestjs/common';
import { Bot } from '@aero-agent/database';
import type { Redis } from 'ioredis';
import { BOTS_REDIS_CLIENT } from '../bots.constants';

const TTL_SECONDS = 300;
const KEY_PREFIX = 'bot:config:';

@Injectable()
export class BotCacheService {
  constructor(@Inject(BOTS_REDIS_CLIENT) private readonly redis: Redis) {}

  async getConfig(botId: string): Promise<Bot | null> {
    const data = await this.redis.get(`${KEY_PREFIX}${botId}`);
    if (!data) return null;
    return JSON.parse(data) as Bot;
  }

  async setConfig(botId: string, bot: Bot): Promise<void> {
    await this.redis.set(`${KEY_PREFIX}${botId}`, JSON.stringify(bot), 'EX', TTL_SECONDS);
  }

  async invalidate(botId: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${botId}`);
  }
}
