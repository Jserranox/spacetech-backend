import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnalyticsEvent,
  ApiKey,
  Bot,
  KnowledgeDocument,
  User,
} from '@aero-agent/database';
import { MetricController } from './controllers/metric.controller';
import { AnalyticsService } from './services/analytics.service';
import { MetricsService } from './services/metrics.service';
import { UsageService } from './services/usage.service';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, Bot, ApiKey, User, KnowledgeDocument])],
  controllers: [MetricController],
  providers: [AnalyticsService, MetricsService, UsageService],
  exports: [AnalyticsService, MetricsService, UsageService],
})
export class AnalyticsModule {}
