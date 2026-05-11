import { Module } from '@nestjs/common';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhooksService } from './services/webhooks.service';
import { WebhookDispatcherService } from './services/webhook-dispatcher.service';
import { SignatureService } from './services/signature.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookDispatcherService, SignatureService]
})
export class WebhooksModule {}
