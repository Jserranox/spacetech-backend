import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  Bot,
  KnowledgeDocument,
  ApiKey,
  User,
} from '@aero-agent/database';

export type CurrentUsage = {
  messagesPerMonth: number;
  documents: number;
  bots: number;
  apiKeys: number;
  members: number;
};

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepo: Repository<AnalyticsEvent>,
    @InjectRepository(Bot)
    private readonly botRepo: Repository<Bot>,
    @InjectRepository(KnowledgeDocument)
    private readonly docRepo: Repository<KnowledgeDocument>,
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getCurrentUsage(orgId: string): Promise<CurrentUsage> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [messagesPerMonth, documents, bots, apiKeys, members] =
      await Promise.all([
        this.eventRepo
          .createQueryBuilder('ae')
          .where('ae.organizationId = :orgId', { orgId })
          .andWhere('ae.eventType = :type', {
            type: AnalyticsEventType.MESSAGE_SENT,
          })
          .andWhere('ae.createdAt >= :from', { from: monthStart })
          .getCount(),
        this.docRepo.count({ where: { organizationId: orgId } }),
        this.botRepo.count({ where: { organizationId: orgId } }),
        this.apiKeyRepo.count({ where: { organizationId: orgId } }),
        this.userRepo.count({ where: { organizationId: orgId } }),
      ]);

    return { messagesPerMonth, documents, bots, apiKeys, members };
  }
}
