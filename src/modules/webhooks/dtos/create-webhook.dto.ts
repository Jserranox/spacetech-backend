import { IsUrl, IsArray, ArrayMinSize, IsEnum } from 'class-validator';
import { WebhookEvent } from '@aero-agent/database';

export class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];
}
