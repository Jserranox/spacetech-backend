import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_REQUIRED_KEY } from '../constants/tenan.constants';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';
import { PlanService } from '../services/plan.service';
import { UsageService } from '../../analytics/services/usage.service';
import { PlanLimits } from '../interfaces/plan-limits.interface';

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly planService: PlanService,
    private readonly usageService: UsageService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<keyof PlanLimits>(
      PLAN_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resource) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const organizationId = request['organizationId'] as string | undefined;
    if (!organizationId) return false;

    const currentPlan = await this.planService.getCurrentPlan(organizationId);
    const limits = this.planService.getLimits(currentPlan);
    const limit = limits[resource];

    if (limit === -1) return true;

    const usage = await this.usageService.getCurrentUsage(organizationId);
    if (usage[resource] >= limit) {
      throw new ForbiddenException('Plan limit reached');
    }

    return true;
  }
}
