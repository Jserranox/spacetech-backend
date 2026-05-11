import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';

export const AuthMetod = (...args: string[]) => SetMetadata('auth-metod', args);
