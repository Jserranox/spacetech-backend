import { IsIn, IsString, IsObject } from 'class-validator';
import { WEBHOOK_EVENTS, WebhookEventType } from '../constants/webhook-events.constants';

const ALL_EVENT_VALUES = Object.values(WEBHOOK_EVENTS);

export class WebhookEventDto {
  @IsIn(ALL_EVENT_VALUES)
  event: WebhookEventType;

  @IsString()
  organizationId: string;

  @IsObject()
  data: Record<string, unknown>;
}
