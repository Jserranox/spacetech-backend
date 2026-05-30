import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { MetricsService } from '../services/metrics.service';
import { UsageService } from '../services/usage.service';
import { AnalyticsService } from '../services/analytics.service';
import { QueryMetricsDto } from '../dtos/query-metrics.dto';

@Controller('analytics')
export class MetricController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly usageService: UsageService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('dashboard')
  async getDashboard(
    @Req() req: Request & { organizationId: string },
    @Query() query: QueryMetricsDto,
  ) {
    const { from, to, granularity } = this.resolveDateRange(query);
    return this.metricsService.getDashboard(req.organizationId, from, to, granularity);
  }

  @Get('metrics/messages')
  async getMessages(
    @Req() req: Request & { organizationId: string },
    @Query() query: QueryMetricsDto,
  ) {
    const { from, to, granularity } = this.resolveDateRange(query);
    return this.metricsService.getMessageVolume(req.organizationId, from, to, granularity);
  }

  @Get('metrics/top-bots')
  async getTopBots(
    @Req() req: Request & { organizationId: string },
    @Query() query: QueryMetricsDto,
  ) {
    const { from, to } = this.resolveDateRange(query);
    const limit = query.limit ?? 10;
    return this.metricsService.getTopBots(req.organizationId, from, to, limit);
  }

  @Get('usage')
  async getUsage(@Req() req: Request & { organizationId: string }) {
    return this.usageService.getCurrentUsage(req.organizationId);
  }

  @Get('events')
  async getEvents(
    @Req() req: Request & { organizationId: string },
    @Query() query: QueryMetricsDto,
  ) {
    return this.analyticsService.getEvents(req.organizationId, query);
  }

  private resolveDateRange(query: QueryMetricsDto): {
    from: Date;
    to: Date;
    granularity: 'hour' | 'day' | 'week';
  } {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const granularity = query.granularity ?? 'day';
    return { from, to, granularity };
  }
}
