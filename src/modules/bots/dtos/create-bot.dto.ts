import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LlmProvider, BotTone } from '@aero-agent/database';

export class BotConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(32000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  contextWindowSize?: number;
}

export class CreateBotDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(LlmProvider)
  llmProvider!: LlmProvider;

  @IsString()
  llmModel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  systemPrompt?: string;

  @IsOptional()
  @IsEnum(BotTone)
  tone?: BotTone;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BotConfigDto)
  config?: BotConfigDto;
}
