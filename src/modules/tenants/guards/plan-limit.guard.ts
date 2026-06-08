import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationPlan } from '@aero-agent/database';
import { PLAN_REQUIRED_KEY } from '../constants/tenan.constants';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';
import { PlanService } from '../services/plan.service';
import {
  UsageService,
  CurrentUsage,
} from '../../analytics/services/usage.service';
import { PlanLimits } from '../interfaces/plan-limits.interface';

const PLAN_HIERARCHY: Record<OrganizationPlan, number> = {
  [OrganizationPlan.FREE]: 1,
  [OrganizationPlan.PRO]: 2,
  [OrganizationPlan.ENTERPRISE]: 3,
};

const RESOURCE_KEYS = new Set<string>([
  'bots',
  'documents',
  'messages',
  'apiKeys',
  'members',
]);

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planService: PlanService,
    private readonly usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<string>(
      PLAN_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resource) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const organizationId = request['organizationId'] as string | undefined;
    if (!organizationId) return false;

    if (RESOURCE_KEYS.has(resource)) {
      const plan = await this.planService.getCurrentPlan(organizationId);
      const limits = this.planService.getLimits(plan);
      const limit = limits[resource as keyof PlanLimits];
      if (limit === -1) return true;
      const usage = await this.usageService.getCurrentUsage(organizationId);
      if (usage[resource as keyof CurrentUsage] >= limit) {
        throw new ForbiddenException('Plan limit reached');
      }
      return true;
    }

    // Fallback: plan tier check for @PlanRequired(OrganizationPlan.PRO) usage
    const currentPlan = await this.planService.getCurrentPlan(organizationId);
    const currentRank = PLAN_HIERARCHY[currentPlan] ?? 0;
    const requiredRank = PLAN_HIERARCHY[resource as OrganizationPlan] ?? 0;
    return currentRank >= requiredRank;
  }
}
