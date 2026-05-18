import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsUUID()
  botId!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
