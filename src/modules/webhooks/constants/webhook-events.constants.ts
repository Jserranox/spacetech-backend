import { WebhookEvent } from '@aero-agent/database';

export const WEBHOOK_EVENTS = {
  MESSAGE_CREATED: WebhookEvent.MESSAGE_SENT,
  MESSAGE_RECEIVED: WebhookEvent.MESSAGE_RECEIVED,
  SESSION_STARTED: WebhookEvent.SESSION_STARTED,
  SESSION_ENDED: WebhookEvent.SESSION_ENDED,
  DOCUMENT_READY: WebhookEvent.DOCUMENT_READY,
  DOCUMENT_FAILED: WebhookEvent.DOCUMENT_FAILED,
  BOT_UPDATED: WebhookEvent.BOT_UPDATED,
} as const;

export type WebhookEventType = WebhookEvent;
