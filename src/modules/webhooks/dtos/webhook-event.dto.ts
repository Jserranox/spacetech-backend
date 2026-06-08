import { IsEnum, IsString, IsObject } from 'class-validator';
import { WebhookEvent } from '@aero-agent/database';

export class WebhookEventDto {
  @IsEnum(WebhookEvent)
  event: WebhookEvent;

  @IsString()
  organizationId: string;

  @IsObject()
  data: Record<string, unknown>;
}
