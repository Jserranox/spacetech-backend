import { SetMetadata } from '@nestjs/common';

export const TransformToInstance = (...args: string[]) => SetMetadata('transform-to-instance', args);
