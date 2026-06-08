export * from './schema';
export * from './app.config';
export * from './auth.config';
export * from './database.config';
export * from './redis.config';
export * from './llm.config';
export * from './storage.config';
export * from './throttle.config';

import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { redisConfig } from './redis.config';
import { llmConfig } from './llm.config';
import { storageConfig } from './storage.config';
import { throttleConfig } from './throttle.config';

export const configLoaders = [
  appConfig,
  authConfig,
  databaseConfig,
  redisConfig,
  llmConfig,
  storageConfig,
  throttleConfig,
];
