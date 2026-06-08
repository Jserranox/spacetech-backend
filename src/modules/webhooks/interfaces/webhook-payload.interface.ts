import { WebhookEvent } from '@aero-agent/database';

export interface IWebhookPayload {
  id: string;
  event: WebhookEvent;
  timestamp: string;
  organizationId: string;
  data: Record<string, unknown>;
}
