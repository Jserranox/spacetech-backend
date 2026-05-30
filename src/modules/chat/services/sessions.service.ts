import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '@aero-agent/database';
import { BotsService } from '../../bots/services/bots.service';
import { WebhookDispatcherService } from '../../webhooks/services/webhook-dispatcher.service';
import { WEBHOOK_EVENTS } from '../../webhooks/constants/webhook-events.constants';

export interface PaginatedSessions {
  data: Session[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly botsService: BotsService,
    private readonly webhookDispatcher: WebhookDispatcherService,
  ) {}

  async create(
    botId: string,
    userId: string,
    orgId: string,
    metadata?: Record<string, unknown>,
  ): Promise<Session> {
    await this.botsService.getByIdForOrg(botId, orgId);

    const session = this.sessionRepo.create({
      botId,
      externalUserId: userId,
      externalUserMetadata: { orgId, ...metadata },
      isActive: true,
      lastActivityAt: new Date(),
    });
    const saved = await this.sessionRepo.save(session);

    this.webhookDispatcher
      .dispatch(WEBHOOK_EVENTS.SESSION_STARTED, orgId, {
        sessionId: saved.id,
        botId,
        userId,
      })
      .catch(() => {});

    return saved;
  }

  async findOne(id: string, orgId: string): Promise<Session> {
    const session = await this.sessionRepo
      .createQueryBuilder('session')
      .innerJoin('session.bot', 'bot')
      .leftJoinAndSelect('session.messages', 'messages')
      .where('session.id = :id', { id })
      .andWhere('bot.organizationId = :orgId', { orgId })
      .orderBy('messages.createdAt', 'ASC')
      .getOne();

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async findForUser(
    userId: string,
    orgId: string,
    opts: { page: number; limit: number },
  ): Promise<PaginatedSessions> {
    const { page, limit } = opts;

    const [data, total] = await this.sessionRepo
      .createQueryBuilder('session')
      .innerJoin('session.bot', 'bot')
      .where('session.externalUserId = :userId', { userId })
      .andWhere('bot.organizationId = :orgId', { orgId })
      .orderBy('session.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async close(id: string, orgId: string): Promise<Session> {
    const session = await this.findBasic(id, orgId);
    session.isActive = false;
    const saved = await this.sessionRepo.save(session);

    this.webhookDispatcher
      .dispatch(WEBHOOK_EVENTS.SESSION_ENDED, orgId, {
        sessionId: id,
        botId: session.botId,
      })
      .catch(() => {});

    return saved;
  }

  async validateActive(id: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (!session.isActive) throw new BadRequestException('Session is closed');
    return session;
  }

  async updateActivity(id: string): Promise<void> {
    await this.sessionRepo.update(id, {
      lastActivityAt: new Date(),
      messageCount: () => 'messageCount + 1',
    });
  }

  private async findBasic(id: string, orgId: string): Promise<Session> {
    const session = await this.sessionRepo
      .createQueryBuilder('session')
      .innerJoin('session.bot', 'bot')
      .where('session.id = :id', { id })
      .andWhere('bot.organizationId = :orgId', { orgId })
      .getOne();

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
