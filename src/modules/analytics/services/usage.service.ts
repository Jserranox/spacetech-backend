import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  ApiKey,
  Bot,
  KnowledgeDocument,
  User,
} from '@aero-agent/database';

export type CurrentUsage = {
  messages: number;
  documents: number;
  bots: number;
  apiKeys: number;
  members: number;
};

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
    @InjectRepository(KnowledgeDocument)
    private readonly docRepo: Repository<KnowledgeDocument>,
    @InjectRepository(Bot)
    private readonly botRepo: Repository<Bot>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getCurrentUsage(orgId: string): Promise<CurrentUsage> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [messages, documents, bots, apiKeys, members] = await Promise.all([
      this.analyticsRepo
        .createQueryBuilder('event')
        .where('event.organizationId = :orgId', { orgId })
        .andWhere('event.eventType = :type', {
          type: AnalyticsEventType.MESSAGE_SENT,
        })
        .andWhere('event.createdAt >= :from', { from: startOfMonth })
        .getCount(),
      this.docRepo.count({ where: { organizationId: orgId } }),
      this.botRepo.count({ where: { organizationId: orgId } }),
      this.apiKeyRepo.count({
        where: { organizationId: orgId, isActive: true },
      }),
      this.userRepo.count({ where: { organizationId: orgId } }),
    ]);

    return { messages, documents, bots, apiKeys, members };
  }
}
