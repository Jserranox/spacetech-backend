import { Injectable } from '@nestjs/common';
import { Bot } from '@aero-agent/database';
import { IPromptContext } from '../interfaces/ai-service.interface';
import { MessagesService } from './messages.service';

const DEFAULT_HISTORY_SIZE = 20;

@Injectable()
export class ConversationContextService {
  constructor(private readonly messagesService: MessagesService) {}

  async buildContext(
    sessionId: string,
    bot: Bot,
    userMessage: string,
    historySize = DEFAULT_HISTORY_SIZE,
  ): Promise<IPromptContext> {
    const messages = await this.messagesService.getLastN(sessionId, historySize);

    const conversationHistory = messages.map((m) => ({
      role: m.role as string,
      content: m.content,
    }));

    return {
      botConfig: bot,
      conversationHistory,
      userMessage,
    };
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).length * 1.33);
  }
}
