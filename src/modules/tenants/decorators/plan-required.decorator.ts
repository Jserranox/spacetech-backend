import { SetMetadata } from '@nestjs/common';

export const PlanRequired = (...args: string[]) => SetMetadata('plan-required', args);
