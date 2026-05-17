import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@aero-agent/database';
import { ROLES_KEY } from '../constants/tenan.constants';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  [MemberRole.OWNER]: 3,
  [MemberRole.ADMIN]: 2,
  [MemberRole.MEMBER]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const user = request['user'] as JwtPayload | undefined;
    if (!user?.role) return false;

    const userRank = ROLE_HIERARCHY[user.role as MemberRole] ?? 0;
    const minRequired = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY[r] ?? 0));

    return userRank >= minRequired;
  }
}
