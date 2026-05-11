import { SetMetadata } from '@nestjs/common/decorators/core/set-metadata.decorator';

export const CurrentUser = (...args: string[]) => SetMetadata('current-user', args);
