import { SetMetadata } from '@nestjs/common';
import { MemberRole } from '@aero-agent/database';
import { ROLES_KEY } from '../constants/tenan.constants';

export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);
