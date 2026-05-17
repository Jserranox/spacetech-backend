import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, OrganizationPlan } from '@aero-agent/database';
import { PLAN_LIMITS } from '../constants/plan-limits.constants';
import { PlanLimits } from '../interfaces/plan-limits.interface';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async getCurrentPlan(orgId: string): Promise<OrganizationPlan> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      select: ['plan'],
    });
    return org?.plan ?? OrganizationPlan.FREE;
  }

  getLimits(plan: OrganizationPlan): PlanLimits {
    const key = (plan as string).toUpperCase() as keyof typeof PLAN_LIMITS;
    return PLAN_LIMITS[key];
  }

  async checkLimit(
    orgId: string,
    resource: keyof PlanLimits,
    currentCount: number,
  ): Promise<boolean> {
    const plan = await this.getCurrentPlan(orgId);
    const limits = this.getLimits(plan);
    const limit = limits[resource];
    return limit === -1 || currentCount < limit;
  }
}
