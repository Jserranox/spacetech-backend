import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization, User, ApiKey } from '@aero-agent/database';

import { AuthModule } from '../auth/auth.module';

import { OrganizationsController } from './controllers/organizations.controller';
import { MembersController } from './controllers/members.controller';
import { ApiKeysController } from './controllers/api-keys.controller';

import { OrganizationsService } from './services/organizations.service';
import { MembersService } from './services/members.service';
import { PlanService } from './services/plan.service';

import { TenantIsolationGuard } from './guards/tenant-isolation.guard';
import { RolesGuard } from './guards/roles.guard';
import { PlanLimitGuard } from './guards/plan-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, ApiKey]),
    AuthModule,
  ],
  controllers: [OrganizationsController, MembersController, ApiKeysController],
  providers: [
    OrganizationsService,
    MembersService,
    PlanService,
    TenantIsolationGuard,
    RolesGuard,
    PlanLimitGuard,
  ],
  exports: [
    OrganizationsService,
    MembersService,
    PlanService,
    TenantIsolationGuard,
    RolesGuard,
    PlanLimitGuard,
  ],
})
export class TenantsModule {}
