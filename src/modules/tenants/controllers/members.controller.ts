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
import { MemberRole, User } from '@aero-agent/database';
import { MembersService } from '../services/members.service';
import { InviteMemberDto } from '../dtos/invite-member.dto';
import { UpdateMemberRoleDto } from '../dtos/update-member-role.dto';
import { Tenant } from '../decorators/tenant.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('organizations/:orgId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  list(@Tenant() orgId: string): Promise<Partial<User>[]> {
    return this.membersService.listMembers(orgId);
  }

  @Post('invite')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  invite(
    @Tenant() orgId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<Partial<User>> {
    return this.membersService.invite(orgId, dto);
  }

  @Delete(':memberId')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Tenant() orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.membersService.remove(orgId, memberId, user.sub);
  }

  @Patch(':memberId/role')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  updateRole(
    @Tenant() orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Partial<User>> {
    return this.membersService.updateRole(orgId, memberId, dto, user.sub);
  }
}
