import { SetMetadata } from '@nestjs/common';

export const Tenant = (...args: string[]) => SetMetadata('tenant', args);
