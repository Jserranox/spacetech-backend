import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  // Primary: DATABASE_URL (used by TypeOrmModule in app.module.ts)
  url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/aeroagent',
  // Individual fields (available for migrations, scripts, and future refactors)
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  name: process.env.DB_NAME ?? 'aeroagent',
  user: process.env.DB_USER ?? 'postgres',
  pass: process.env.DB_PASS ?? 'postgres',
  ssl: process.env.DB_SSL === 'true',
  synchronize: (process.env.NODE_ENV ?? 'development') === 'development',
  logging: (process.env.NODE_ENV ?? 'development') === 'development',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
