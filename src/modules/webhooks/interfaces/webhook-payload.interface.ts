import { WebhookEventType } from '../constants/webhook-events.constants';

export interface IWebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  organizationId: string;
  data: Record<string, unknown>;
}
