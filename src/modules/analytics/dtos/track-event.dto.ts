import { IsEnum, IsUUID, IsOptional, IsObject, IsInt, Min } from 'class-validator';
import { AnalyticsEventType } from '@aero-agent/database';

export class TrackEventDto {
  @IsEnum(AnalyticsEventType)
  eventType: AnalyticsEventType;

  @IsOptional()
  @IsUUID()
  botId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  messageId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokensInput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokensOutput?: number;
}
