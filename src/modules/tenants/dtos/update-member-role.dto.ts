import { IsEnum } from 'class-validator';
import { MemberRole } from '@aero-agent/database';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  role: MemberRole;
}
