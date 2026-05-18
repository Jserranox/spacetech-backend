import { Bot, BotTone, LlmProvider } from '@aero-agent/database';

export class BotResponseDto {
  id!: string;
  organizationId!: string;
  name!: string;
  description!: string | null;
  llmProvider!: LlmProvider;
  llmModel!: string;
  systemPrompt!: string;
  tone!: BotTone;
  temperature!: number;
  maxTokens!: number;
  contextWindowSize!: number;
  isActive!: boolean;
  isPublic!: boolean;
  totalSessions!: number;
  totalMessages!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(bot: Bot): BotResponseDto {
    const dto = new BotResponseDto();
    dto.id = bot.id;
    dto.organizationId = bot.organizationId;
    dto.name = bot.name;
    dto.description = bot.description;
    dto.llmProvider = bot.llmProvider;
    dto.llmModel = bot.llmModel;
    dto.systemPrompt = bot.systemPrompt;
    dto.tone = bot.tone;
    dto.temperature = Number(bot.temperature);
    dto.maxTokens = bot.maxTokens;
    dto.contextWindowSize = bot.contextWindowSize;
    dto.isActive = bot.isActive;
    dto.isPublic = bot.isPublic;
    dto.totalSessions = bot.totalSessions;
    dto.totalMessages = bot.totalMessages;
    dto.createdAt = bot.createdAt;
    dto.updatedAt = bot.updatedAt;
    return dto;
  }
}
