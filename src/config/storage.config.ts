import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  bucket: process.env.S3_BUCKET ?? 'aero-agent-docs',
  accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
  region: process.env.S3_REGION ?? 'us-east-1',
  forcePathStyle: (process.env.S3_FORCE_PATH ?? 'true') === 'true',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '20', 10),
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/html',
  ],
}));

export type StorageConfig = ReturnType<typeof storageConfig>;
