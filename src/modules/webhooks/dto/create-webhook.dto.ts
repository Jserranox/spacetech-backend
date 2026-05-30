import {
  IsUrl,
  IsArray,
  ArrayMinSize,
  IsOptional,
  IsUUID,
  IsObject,
  IsIn,
} from 'class-validator';
import { WebhookEvent } from '@aero-agent/database';

const ALL_WEBHOOK_EVENTS = Object.values(WebhookEvent);

export class CreateWebhookDto {
  @IsUrl({ require_tld: false, protocols: ['https', 'http'] })
  url: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(ALL_WEBHOOK_EVENTS, { each: true })
  events: WebhookEvent[];

  @IsOptional()
  @IsUUID()
  botId?: string;

  @IsOptional()
  @IsObject()
  customHeaders?: Record<string, string>;
}
