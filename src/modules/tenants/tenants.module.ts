import { Module } from '@nestjs/common';
import { OrganizationsController } from './controllers/organizations.controller';
import { MembersController } from './controllers/members.controller';
import { ApiKeysController } from './controllers/api-keys.controller';
import { MembersService } from './services/members.service';
import { OrganizationsService } from './services/organizations.service';
import { PlanService } from './services/plan.service';

@Module({
  controllers: [OrganizationsController, MembersController, ApiKeysController],
  providers: [MembersService, OrganizationsService, PlanService]
})
export class TenantsModule {}
