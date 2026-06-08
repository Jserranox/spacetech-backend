import { IsEnum, IsInt, IsObject, IsOptional, IsUUID, Min } from 'class-validator';
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
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokensInput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokensOutput?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;
}
