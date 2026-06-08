import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '@aero-agent/database';
import { TrackEventDto } from '../dtos/track-event.dto';
import { QueryMetricsDto } from '../dtos/query-metrics.dto';

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  track(dto: TrackEventDto, ctx: { orgId: string }): void {
    if (!dto.botId) {
      this.logger.warn(
        `Analytics track skipped: botId required for event ${dto.eventType}`,
      );
      return;
    }
    this.analyticsRepo
      .save({
        eventType: dto.eventType,
        organizationId: ctx.orgId,
        botId: dto.botId,
        sessionId: dto.sessionId ?? null,
        messageId: dto.messageId ?? null,
        payload: dto.metadata ?? null,
        tokensInput: dto.tokensInput ?? null,
        tokensOutput: dto.tokensOutput ?? null,
        latencyMs: dto.latencyMs ?? null,
      })
      .catch((err: Error) =>
        this.logger.warn('Analytics track failed', err.message),
      );
  }

  async trackAsync(
    dto: TrackEventDto,
    ctx: { orgId: string },
  ): Promise<AnalyticsEvent | null> {
    if (!dto.botId) return null;
    return this.analyticsRepo.save({
      eventType: dto.eventType,
      organizationId: ctx.orgId,
      botId: dto.botId,
      sessionId: dto.sessionId ?? null,
      messageId: dto.messageId ?? null,
      payload: dto.metadata ?? null,
      tokensInput: dto.tokensInput ?? null,
      tokensOutput: dto.tokensOutput ?? null,
      latencyMs: dto.latencyMs ?? null,
    });
  }

  async getEvents(
    orgId: string,
    query: QueryMetricsDto,
  ): Promise<{ data: AnalyticsEvent[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const from = query.from ? new Date(query.from) : subDays(new Date(), 30);
    const to = query.to ? new Date(query.to) : new Date();

    const qb = this.analyticsRepo
      .createQueryBuilder('event')
      .where('event.organizationId = :orgId', { orgId })
      .andWhere('event.createdAt BETWEEN :from AND :to', { from, to });

    if (query.botId) {
      qb.andWhere('event.botId = :botId', { botId: query.botId });
    }

    const [data, total] = await qb
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
}
