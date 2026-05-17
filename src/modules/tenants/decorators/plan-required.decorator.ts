import { SetMetadata } from '@nestjs/common';
import { OrganizationPlan } from '@aero-agent/database';
import { PLAN_REQUIRED_KEY } from '../constants/tenan.constants';

export const PlanRequired = (plan: OrganizationPlan | string) =>
  SetMetadata(PLAN_REQUIRED_KEY, plan);
