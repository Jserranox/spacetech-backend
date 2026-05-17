import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/constants/auth.constants';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const user = request['user'] as JwtPayload | undefined;

    if (!user?.organizationId) return false;

    request['organizationId'] = user.organizationId;
    request['userId'] = user.sub;
    return true;
  }
}
