import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    if (client.data['user']) return true;

    const token = this.extractToken(client);
    if (!token) throw new WsException('Missing authentication token');

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data['user'] = payload;
      return true;
    } catch {
      throw new WsException('Invalid or expired token');
    }
  }

  extractToken(client: Socket): string | undefined {
    return (
      (client.handshake.auth as Record<string, unknown>)?.['token'] as string | undefined) ??
      (client.handshake.query?.['token'] as string | undefined);
  }
}
