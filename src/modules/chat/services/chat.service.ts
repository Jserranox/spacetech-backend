import { Inject, Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AnalyticsEventType, MessageRole } from '@aero-agent/database';
import { IAiService, AI_SERVICE_TOKEN } from '../interfaces/ai-service.interface';
import { SessionsService } from './sessions.service';
import { MessagesService } from './messages.service';
import { ConversationContextService } from './conversation-context.service';
import { BotsService } from '../../bots/services/bots.service';
import { RagService } from '../../rag/services/rag.service';
import { WebhookDispatcherService } from '../../webhooks/services/webhook-dispatcher.service';
import { WEBHOOK_EVENTS } from '../../webhooks/constants/webhook-events.constants';
import { AnalyticsService } from '../../analytics/services/analytics.service';
import { QueryMessagesDto } from '../dtos/query-messages.dto';
import { Message } from '@aero-agent/database';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly messagesService: MessagesService,
    private readonly conversationContextService: ConversationContextService,
    private readonly botsService: BotsService,
    private readonly ragService: RagService,
    private readonly webhookDispatcher: WebhookDispatcherService,
    private readonly analyticsService: AnalyticsService,
    @Inject(AI_SERVICE_TOKEN) private readonly aiService: IAiService,
  ) {}

  async handleMessage(
    sessionId: string,
    userMessage: string,
    orgId: string,
    socket: Socket,
  ): Promise<void> {
    const startTime = Date.now();
    const session = await this.sessionsService.validateActive(sessionId);
    const bot = await this.botsService.getByIdForOrg(session.botId, orgId);

    await this.messagesService.create(sessionId, MessageRole.USER, userMessage);

    const context = await this.conversationContextService.buildContext(
      sessionId,
      bot,
      userMessage,
    );

    const ragChunks = await this.ragService.retrieve(userMessage, bot.id);
    if (ragChunks.length) context.ragChunks = ragChunks;

    let fullResponse = '';

    const stream =
      bot.useTools && this.aiService.generateWithTools
        ? this.aiService.generateWithTools(context)
        : this.aiService.generateStream(context);

    try {
      for await (const chunk of stream) {
        fullResponse += chunk;
        socket.emit('chunk', {
          sessionId,
          chunk,
          isLast: false,
        });
      }
    } catch (error) {
      this.logger.error(`Stream error for session ${sessionId}`, error);

      if (fullResponse) {
        const msg = await this.messagesService.create(
          sessionId,
          MessageRole.ASSISTANT,
          fullResponse,
        );
        socket.emit('chunk', { sessionId, chunk: '', isLast: true, messageId: msg.id });
      }

      socket.emit('error', { message: 'Stream interrupted', code: 'STREAM_ERROR' });
      return;
    }

    const tokens = this.conversationContextService.estimateTokens(fullResponse);
    const assistantMsg = await this.messagesService.create(
      sessionId,
      MessageRole.ASSISTANT,
      fullResponse,
      tokens,
    );

    await this.sessionsService.updateActivity(sessionId);

    socket.emit('chunk', {
      sessionId,
      chunk: '',
      isLast: true,
      messageId: assistantMsg.id,
    });

    socket.emit('message-done', {
      messageId: assistantMsg.id,
      sessionId,
      totalTokens: tokens,
    });

    this.webhookDispatcher
      .dispatch(WEBHOOK_EVENTS.MESSAGE_SENT, orgId, {
        sessionId,
        messageId: assistantMsg.id,
        botId: bot.id,
        role: 'assistant',
        tokens,
      })
      .catch(() => {});

    this.analyticsService.track(
      {
        eventType: AnalyticsEventType.MESSAGE_SENT,
        botId: bot.id,
        sessionId,
        messageId: assistantMsg.id,
        latencyMs: Date.now() - startTime,
        tokensOutput: tokens,
      },
      { orgId },
    );
  }

  async getSessionMessages(
    sessionId: string,
    orgId: string,
    query: QueryMessagesDto,
  ): Promise<Message[]> {
    await this.sessionsService.findOne(sessionId, orgId);
    return this.messagesService.findBySession(sessionId, query);
  }
}
