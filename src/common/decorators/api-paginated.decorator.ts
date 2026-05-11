import { SetMetadata } from '@nestjs/common';

export const ApiPaginated = (...args: string[]) => SetMetadata('api-paginated', args);
