import { Module } from '@nestjs/common';
import { SessionsController } from './controllers/sessions.controller';
import { MessagesController } from './controllers/messages.controller';
import { ChatService } from './services/chat.service';
import { SessionsService } from './services/sessions.service';
import { MessagesService } from './services/messages.service';
import { ConversationContextService } from './services/conversation-context.service';

@Module({
  controllers: [SessionsController, MessagesController],
  providers: [ChatService, SessionsService, MessagesService, ConversationContextService]
})
export class ChatModule {}
