import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwt: {
    // Variable names match existing code: JWT_SECRET / JWT_REFRESH_SECRET
    accessSecret: process.env.JWT_SECRET ?? 'dev-access-secret-change-in-prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-prod',
    // JWT_EXPIRES_IN_SECONDS is a number; JWT_REFRESH_EXPIRES_IN is a duration string
    accessExpiresInSeconds: parseInt(process.env.JWT_EXPIRES_IN_SECONDS ?? '900', 10),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  apiKey: {
    prefix: 'aero_',
    bcryptRounds: 12,
    maxPerUser: 5,
  },
  maxRefreshTokensPerUser: 5,
}));

export type AuthConfig = ReturnType<typeof authConfig>;
