import { SetMetadata } from '@nestjs/common';

export const Tool = (...args: string[]) => SetMetadata('tool', args);
