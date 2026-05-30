import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Webhook } from '@aero-agent/database';
import { QueueName } from '@aero-agent/queue';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhooksService } from './services/webhooks.service';
import { WebhookDispatcherService } from './services/webhook-dispatcher.service';
import { SignatureService } from './services/signature.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    BullModule.registerQueue({ name: QueueName.WEBHOOKS }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDispatcherService, SignatureService],
  exports: [WebhooksService, WebhookDispatcherService],
})
export class WebhooksModule {}
