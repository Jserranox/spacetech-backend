import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from '../services/chat.service';
import { SessionsService } from '../services/sessions.service';
import { WsAuthGuard } from '../guards/ws-auth.guard';
import { WsExceptionFilter } from '../filters/ws-exception.filter';
import { SendMessageDto } from '../dtos/send-message.dto';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
@UseGuards(WsAuthGuard)
@UseFilters(WsExceptionFilter)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket): void {
    const guard = new WsAuthGuard(this.jwtService);
    const token = guard.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      client.data['user'] = payload;
      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    client: Socket,
    data: { sessionId: string },
  ): Promise<void> {
    await client.join(data.sessionId);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, data: SendMessageDto): Promise<void> {
    const user = client.data['user'] as JwtPayload;
    await this.chatService.handleMessage(
      data.sessionId,
      data.content,
      user.organizationId,
      client,
    );
  }

  @SubscribeMessage('end-session')
  async handleEndSession(
    client: Socket,
    data: { sessionId: string },
  ): Promise<void> {
    const user = client.data['user'] as JwtPayload;
    await this.sessionsService.close(data.sessionId, user.organizationId);
  }
}
