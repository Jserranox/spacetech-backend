import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configLoaders } from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationPipe } from '@nestjs/common';
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
import { QueueModule } from '@aero-agent/queue';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { BotsModule } from './modules/bots/bots.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { RagModule } from './modules/rag/rag.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configLoaders,
      cache: true,
      expandVariables: true,
    }),
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
    WebhooksModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Guards — orden: JWT → tenant → roles → plan
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantIsolationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PlanLimitGuard },

    // Filters — HttpExceptionFilter primero (específico), AllExceptionsFilter como catch-all
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // Interceptors — orden de ejecución: logging → timeout → transform
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // Pipe global de validación
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
