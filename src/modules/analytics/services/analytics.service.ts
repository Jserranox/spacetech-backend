import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '@aero-agent/database';
import { TrackEventDto } from '../dtos/track-event.dto';
import { QueryMetricsDto } from '../dtos/query-metrics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepo: Repository<AnalyticsEvent>,
  ) {}

  // Fire-and-forget: never throws, never blocks.
  track(dto: TrackEventDto, ctx: { orgId: string }): void {
    if (!dto.botId) return; // botId is required in entity
    this.trackAsync(dto, ctx).catch((err) =>
      this.logger.warn('Analytics track failed', err.message),
    );
  }

  async trackAsync(
    dto: TrackEventDto,
    ctx: { orgId: string },
  ): Promise<AnalyticsEvent> {
    const event = this.eventRepo.create({
      organizationId: ctx.orgId,
      botId: dto.botId!,
      sessionId: dto.sessionId ?? null,
      messageId: dto.messageId ?? null,
      eventType: dto.eventType,
      payload: dto.payload ?? null,
      latencyMs: dto.latencyMs ?? null,
      tokensInput: dto.tokensInput ?? null,
      tokensOutput: dto.tokensOutput ?? null,
    });
    return this.eventRepo.save(event);
  }

  async getEvents(
    orgId: string,
    query: QueryMetricsDto,
  ): Promise<{ data: AnalyticsEvent[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = query.to ? new Date(query.to) : new Date();

    const qb = this.eventRepo
      .createQueryBuilder('ae')
      .where('ae.organizationId = :orgId', { orgId })
      .andWhere('ae.createdAt BETWEEN :from AND :to', { from, to });

    if (query.botId) {
      qb.andWhere('ae.botId = :botId', { botId: query.botId });
    }

    const [data, total] = await qb
      .orderBy('ae.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
}
