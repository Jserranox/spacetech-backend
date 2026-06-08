import { registerAs } from '@nestjs/config';

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  auth: {
    ttl: 60,
    limit: 10,
  },
  upload: {
    ttl: 60,
    limit: 5,
  },
  api: {
    ttl: 60,
    limit: 200,
  },
}));

export type ThrottleConfig = ReturnType<typeof throttleConfig>;
