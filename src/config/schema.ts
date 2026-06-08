export interface EnvironmentVariables {
  // App
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  APP_NAME: string;
  APP_URL: string;

  // Auth — names match actual code usage
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
  JWT_REFRESH_EXPIRES_IN: string;

  // Database — app uses DATABASE_URL; individual fields available for migrations/config
  DATABASE_URL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASS: string;
  DB_SSL: boolean;

  // Redis
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_TTL: number;

  // Storage (S3/MinIO)
  S3_ENDPOINT: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_REGION: string;
  S3_FORCE_PATH: boolean;
  MAX_FILE_SIZE_MB: number;

  // LLM Providers
  OPENAI_API_KEY: string;
  OPENAI_BASE_URL: string;
  ANTHROPIC_API_KEY: string;
  GROQ_API_KEY: string;
  OLLAMA_BASE_URL: string;

  // Tools
  NASA_API_KEY: string;
  SERPAPI_KEY: string;

  // Webhooks
  WEBHOOK_ENCRYPTION_KEY: string;
  WEBHOOK_TIMEOUT_MS: number;
  WEBHOOK_MAX_ATTEMPTS: number;

  // Throttle
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
}
