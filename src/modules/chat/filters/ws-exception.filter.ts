import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    const code =
      exception instanceof WsException ? 'WS_ERROR' : 'INTERNAL_ERROR';

    this.logger.error(`WS [${code}]: ${message}`);

    client.emit('error', {
      message,
      code,
      timestamp: new Date().toISOString(),
    });
  }
}
