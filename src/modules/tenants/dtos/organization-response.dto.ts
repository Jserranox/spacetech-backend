import { OrganizationPlan } from '@aero-agent/database';

export class OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  isActive: boolean;
  memberCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
