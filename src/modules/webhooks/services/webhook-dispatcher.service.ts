import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { QueueName, JobName, WebhookDispatchJob } from '@aero-agent/queue';
import { WebhooksService } from './webhooks.service';
import { SignatureService } from './signature.service';
import { IWebhookPayload } from '../interfaces/webhook-payload.interface';
import { WebhookEventType } from '../constants/webhook-events.constants';

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;

  constructor(
    @InjectQueue(QueueName.WEBHOOKS)
    private readonly webhookQueue: Queue<WebhookDispatchJob>,
    private readonly webhooksService: WebhooksService,
    private readonly signatureService: SignatureService,
    private readonly config: ConfigService,
  ) {
    this.timeoutMs = this.config.get<number>('WEBHOOK_TIMEOUT_MS', 10000);
    this.maxAttempts = this.config.get<number>('WEBHOOK_MAX_ATTEMPTS', 5);
  }

  async dispatch(
    event: WebhookEventType,
    orgId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      const webhooks = await this.webhooksService.findActiveByOrgAndEvent(orgId, event);
      for (const webhook of webhooks) {
        const deliveryId = randomUUID();
        this.webhookQueue
          .add(
            JobName.WEBHOOK_DISPATCH,
            {
              webhookId: webhook.id,
              event,
              payload: { deliveryId, orgId, data },
              attempt: 0,
            },
            {
              attempts: this.maxAttempts,
              backoff: { type: 'exponential', delay: 10_000 },
              removeOnComplete: 200,
              removeOnFail: 100,
            },
          )
          .catch((err) => {
            this.logger.error(`Failed to enqueue delivery ${deliveryId} for webhook ${webhook.id}`, err);
          });
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch event ${event} for org ${orgId}`, err);
    }
  }

  async processDelivery(job: Job<WebhookDispatchJob>): Promise<void> {
    const { webhookId, event, payload } = job.data;
    const { deliveryId, orgId, data } = payload as {
      deliveryId: string;
      orgId: string;
      data: Record<string, unknown>;
    };

    const webhook = await this.webhooksService.findOne(webhookId, orgId);

    const webhookPayload: IWebhookPayload = {
      id: deliveryId,
      event: event as WebhookEventType,
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      data,
    };

    const body = JSON.stringify(webhookPayload);
    const rawSecret = this.signatureService.decryptSecret(webhook.signingSecret);
    const signature = this.signatureService.sign(body, rawSecret);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let statusCode = 0;
    let success = false;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Aero-Signature': signature,
        'X-Aero-Delivery': deliveryId,
        'X-Aero-Event': event,
        ...(webhook.customHeaders ?? {}),
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      statusCode = response.status;
      success = statusCode >= 200 && statusCode < 300;

      if (!success) {
        throw new Error(`Webhook endpoint returned ${statusCode}`);
      }
    } finally {
      clearTimeout(timer);
      this.webhooksService
        .updateDeliveryStats(webhookId, success, statusCode)
        .catch((err) => this.logger.error(`Failed to update delivery stats for ${webhookId}`, err));
    }
  }
}
