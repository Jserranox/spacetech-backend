import { registerAs } from '@nestjs/config';
import type { EnvironmentVariables } from './schema';

export const appConfig = registerAs('app', () => ({
  env: (process.env.NODE_ENV ?? 'development') as EnvironmentVariables['NODE_ENV'],
  port: parseInt(process.env.PORT ?? '3000', 10),
  name: process.env.APP_NAME ?? 'Aero Agent',
  url: process.env.APP_URL ?? 'http://localhost:3000',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
}));

export type AppConfig = ReturnType<typeof appConfig>;
