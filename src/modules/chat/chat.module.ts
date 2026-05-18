import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session, Message } from '@aero-agent/database';

import { AuthModule } from '../auth/auth.module';
import { BotsModule } from '../bots/bots.module';
import { AiModule } from '../ai/ai.module';
import { RagModule } from '../rag/rag.module';

import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';
import { SessionsService } from './services/sessions.service';
import { MessagesService } from './services/messages.service';
import { ConversationContextService } from './services/conversation-context.service';
import { SessionsController } from './controllers/sessions.controller';
import { MessagesController } from './controllers/messages.controller';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { WsExceptionFilter } from './filters/ws-exception.filter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Message]),
    AuthModule,
    BotsModule,
    AiModule,
    RagModule,
  ],
  controllers: [SessionsController, MessagesController],
  providers: [
    ChatGateway,
    ChatService,
    SessionsService,
    MessagesService,
    ConversationContextService,
    WsAuthGuard,
    WsExceptionFilter,
  ],
  exports: [ChatService, SessionsService],
})
export class ChatModule {}
