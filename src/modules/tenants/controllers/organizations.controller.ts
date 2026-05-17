import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MemberRole } from '@aero-agent/database';
import { OrganizationsService } from '../services/organizations.service';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { OrganizationResponseDto } from '../dtos/organization-response.dto';
import { Tenant } from '../decorators/tenant.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Get('me')
  getMyOrganization(@Tenant() orgId: string): Promise<OrganizationResponseDto> {
    return this.orgsService.getMyOrganization(orgId);
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.orgsService.update(id, dto);
  }

  @Post(':id/transfer-ownership')
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  transferOwnership(
    @Param('id') orgId: string,
    @Body('targetUserId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.orgsService.transferOwnership(orgId, targetUserId, user.sub);
  }

  @Delete(':id')
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(
    @Param('id') orgId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.orgsService.softDelete(orgId, user.sub);
  }
}
