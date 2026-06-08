import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { WebhookEvent } from '@aero-agent/database';
import { QueueName, JobName } from '@aero-agent/queue';
import { WebhooksService } from './webhooks.service';
import { SignatureService } from './signature.service';
import { IWebhookPayload } from '../interfaces/webhook-payload.interface';

interface WebhookDeliveryData {
  webhookId: string;
  event: string;
  organizationId: string;
  deliveryId: string;
  data: Record<string, unknown>;
}

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(
    @InjectQueue(QueueName.WEBHOOKS)
    private readonly queue: Queue,
    private readonly webhooksService: WebhooksService,
    private readonly signatureService: SignatureService,
  ) {}

  async dispatch(
    event: WebhookEvent,
    orgId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    let webhooks: Awaited<ReturnType<WebhooksService['findActiveByOrgAndEvent']>>;

    try {
      webhooks = await this.webhooksService.findActiveByOrgAndEvent(orgId, event);
    } catch (err) {
      this.logger.error(`Failed to fetch webhooks for org ${orgId}, event ${event}`, err);
      return;
    }

    for (const webhook of webhooks) {
      const deliveryId = randomUUID();
      const jobData: WebhookDeliveryData = {
        webhookId: webhook.id,
        event,
        organizationId: orgId,
        deliveryId,
        data,
      };

      this.queue
        .add(JobName.WEBHOOK_DISPATCH, jobData, {
          attempts: parseInt(process.env.WEBHOOK_MAX_ATTEMPTS ?? '5', 10),
          backoff: { type: 'exponential', delay: 10_000 },
          removeOnComplete: 200,
          removeOnFail: 100,
        })
        .catch((err) =>
          this.logger.error(
            `Failed to enqueue webhook delivery for webhook ${webhook.id}`,
            err,
          ),
        );
    }
  }

  async processDelivery(job: Job<WebhookDeliveryData>): Promise<void> {
    const { webhookId, event, organizationId, deliveryId, data } = job.data;

    const webhook = await this.webhooksService.findOne(webhookId, organizationId);

    const payload: IWebhookPayload = {
      id: deliveryId,
      event: event as WebhookEvent,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    };

    const body = JSON.stringify(payload);
    const rawSecret = this.signatureService.decryptSecret(webhook.signingSecret);
    const signature = this.signatureService.sign(body, rawSecret);

    const timeoutMs = parseInt(process.env.WEBHOOK_TIMEOUT_MS ?? '10000', 10);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Aero-Signature': signature,
      'X-Aero-Delivery': deliveryId,
      'X-Aero-Event': event,
      ...(webhook.customHeaders ?? {}),
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const success = response.status >= 200 && response.status < 300;
      await this.webhooksService.updateDelivery(webhookId, organizationId, response.status, success);

      if (!success) {
        throw new Error(`Webhook delivery failed: HTTP ${response.status} from ${webhook.url}`);
      }
    } catch (err) {
      clearTimeout(timer);
      await this.webhooksService
        .updateDelivery(webhookId, organizationId, null, false)
        .catch((e) => this.logger.error('Failed to update delivery status', e));
      throw err;
    }
  }
}
