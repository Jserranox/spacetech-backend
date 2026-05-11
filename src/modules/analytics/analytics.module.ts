import { Module } from '@nestjs/common';
import { MetricController } from './controllers/metric.controller';
import { AnalyticsService } from './services/analytics.service';
import { MetricsService } from './services/metrics.service';
import { UsageService } from './services/usage.service';

@Module({
  controllers: [MetricController],
  providers: [AnalyticsService, MetricsService, UsageService]
})
export class AnalyticsModule {}
