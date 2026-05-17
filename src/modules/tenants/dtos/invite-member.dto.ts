import { IsEmail, IsEnum } from 'class-validator';
import { MemberRole } from '@aero-agent/database';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(MemberRole)
  role: MemberRole;
}
