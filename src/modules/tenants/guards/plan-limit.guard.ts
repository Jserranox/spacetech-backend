import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationPlan } from '@aero-agent/database';
import { PLAN_REQUIRED_KEY } from '../constants/tenan.constants';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';
import { PlanService } from '../services/plan.service';

const PLAN_HIERARCHY: Record<OrganizationPlan, number> = {
  [OrganizationPlan.FREE]: 1,
  [OrganizationPlan.PRO]: 2,
  [OrganizationPlan.ENTERPRISE]: 3,
};

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planService: PlanService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<string>(PLAN_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const organizationId = request['organizationId'] as string | undefined;
    if (!organizationId) return false;

    const currentPlan = await this.planService.getCurrentPlan(organizationId);
    const currentRank = PLAN_HIERARCHY[currentPlan] ?? 0;
    const requiredRank = PLAN_HIERARCHY[requiredPlan as OrganizationPlan] ?? 0;

    return currentRank >= requiredRank;
  }
}
