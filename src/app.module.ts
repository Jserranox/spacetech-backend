import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantIsolationGuard } from './modules/tenants/guards/tenant-isolation.guard';
import { RolesGuard } from './modules/tenants/guards/roles.guard';
import { PlanLimitGuard } from './modules/tenants/guards/plan-limit.guard';
import {
  Organization,
  User,
  ApiKey,
  Bot,
  Session,
  Message,
  KnowledgeDocument,
  DocumentChunk,
  AnalyticsEvent,
  Webhook,
} from '@aero-agent/database';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from '@libs/queue';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { BotsModule } from './modules/bots/bots.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { RagModule } from './modules/rag/rag.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ToolsModule } from './modules/tools/tools.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          Organization,
          User,
          ApiKey,
          Bot,
          Session,
          Message,
          KnowledgeDocument,
          DocumentChunk,
          AnalyticsEvent,
          Webhook,
        ],
        synchronize: false,
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    QueueModule.forRoot(),
    TenantsModule,
    AuthModule,
    BotsModule,
    ChatModule,
    AiModule,
    RagModule,
    KnowledgeModule,
    ToolsModule,
    WebhooksModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantIsolationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PlanLimitGuard },
  ],
})
export class AppModule {}
