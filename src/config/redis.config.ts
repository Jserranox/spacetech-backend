import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  ttl: parseInt(process.env.REDIS_TTL ?? '300', 10),
  // Parsed individual fields (for BullMQ connection options)
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
}));

export type RedisConfig = ReturnType<typeof redisConfig>;
