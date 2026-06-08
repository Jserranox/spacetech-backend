import { Controller, Get, Query } from '@nestjs/common';
import { Tenant } from '../../tenants/decorators/tenant.decorator';
import { AnalyticsService } from '../services/analytics.service';
import { MetricsService } from '../services/metrics.service';
import { UsageService } from '../services/usage.service';
import { QueryMetricsDto } from '../dtos/query-metrics.dto';

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

@Controller('analytics')
export class MetricController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly metricsService: MetricsService,
    private readonly usageService: UsageService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Tenant() orgId: string, @Query() query: QueryMetricsDto) {
    const from = query.from ? new Date(query.from) : subDays(new Date(), 30);
    const to = query.to ? new Date(query.to) : new Date();
    return this.metricsService.getDashboard(
      orgId,
      from,
      to,
      query.granularity ?? 'day',
    );
  }

  @Get('metrics/messages')
  async getMessageVolume(
    @Tenant() orgId: string,
    @Query() query: QueryMetricsDto,
  ) {
    const from = query.from ? new Date(query.from) : subDays(new Date(), 30);
    const to = query.to ? new Date(query.to) : new Date();
    return this.metricsService.getMessageVolume(
      orgId,
      from,
      to,
      query.granularity ?? 'day',
    );
  }

  @Get('metrics/top-bots')
  async getTopBots(@Tenant() orgId: string, @Query() query: QueryMetricsDto) {
    const from = query.from ? new Date(query.from) : subDays(new Date(), 30);
    const to = query.to ? new Date(query.to) : new Date();
    return this.metricsService.getTopBots(orgId, from, to, query.limit ?? 10);
  }

  @Get('usage')
  getUsage(@Tenant() orgId: string) {
    return this.usageService.getCurrentUsage(orgId);
  }

  @Get('events')
  getEvents(@Tenant() orgId: string, @Query() query: QueryMetricsDto) {
    return this.analyticsService.getEvents(orgId, query);
  }
}
