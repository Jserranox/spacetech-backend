import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot, BotTone } from '@aero-agent/database';
import { CreateBotDto } from '../dtos/create-bot.dto';
import { UpdateBotDto } from '../dtos/update-bot.dto';
import { QueryBotsDto } from '../dtos/query-bots-dto';
import { BotResponseDto } from '../dtos/filters/bot-response.dto';
import { BotConfigService } from './bot-config.service';
import { PlanService } from '../../tenants/services/plan.service';

export interface PaginatedBots {
  data: Bot[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(Bot)
    private readonly botRepo: Repository<Bot>,
    private readonly botConfigService: BotConfigService,
    private readonly planService: PlanService,
  ) {}

  async create(orgId: string, dto: CreateBotDto): Promise<BotResponseDto> {
    const currentCount = await this.botRepo.count({
      where: { organizationId: orgId },
    });
    const allowed = await this.planService.checkLimit(orgId, 'bots', currentCount);
    if (!allowed) {
      throw new ForbiddenException('Bot limit reached for your current plan');
    }

    const config = this.botConfigService.mergeDefaults(dto.llmProvider, {
      temperature: dto.config?.temperature,
      maxTokens: dto.config?.maxTokens,
    });

    const bot = this.botRepo.create({
      organizationId: orgId,
      name: dto.name,
      description: dto.description ?? null,
      llmProvider: dto.llmProvider,
      llmModel: dto.llmModel,
      systemPrompt: dto.systemPrompt ?? '',
      tone: dto.tone ?? BotTone.FRIENDLY,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      contextWindowSize: dto.config?.contextWindowSize,
    });

    const saved = await this.botRepo.save(bot);
    return BotResponseDto.fromEntity(saved);
  }

  async findAll(orgId: string, query: QueryBotsDto): Promise<PaginatedBots> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.botRepo
      .createQueryBuilder('bot')
      .where('bot.organizationId = :orgId', { orgId });

    if (query.search) {
      qb.andWhere('bot.name ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('bot.isActive = :isActive', { isActive: query.isActive });
    }

    const [data, total] = await qb
      .orderBy('bot.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, orgId: string): Promise<Bot> {
    const bot = await this.botRepo.findOne({ where: { id, organizationId: orgId } });
    if (!bot) throw new NotFoundException('Bot not found');
    return bot;
  }

  async update(id: string, orgId: string, dto: UpdateBotDto): Promise<Bot> {
    const bot = await this.findOne(id, orgId);

    if (dto.name !== undefined) bot.name = dto.name;
    if (dto.description !== undefined) bot.description = dto.description ?? null;
    if (dto.llmProvider !== undefined) bot.llmProvider = dto.llmProvider;
    if (dto.llmModel !== undefined) bot.llmModel = dto.llmModel;
    if (dto.systemPrompt !== undefined) bot.systemPrompt = dto.systemPrompt;
    if (dto.tone !== undefined) bot.tone = dto.tone;

    if (dto.config) {
      const provider = dto.llmProvider ?? bot.llmProvider;
      const merged = this.botConfigService.mergeDefaults(provider, {
        temperature: dto.config.temperature,
        maxTokens: dto.config.maxTokens,
      });
      if (dto.config.temperature !== undefined) bot.temperature = merged.temperature;
      if (dto.config.maxTokens !== undefined) bot.maxTokens = merged.maxTokens;
      if (dto.config.contextWindowSize !== undefined) {
        bot.contextWindowSize = dto.config.contextWindowSize;
      }
    }

    return this.botRepo.save(bot);
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.botRepo.softDelete(id);
  }

  async getByIdForOrg(id: string, orgId: string): Promise<Bot> {
    return this.findOne(id, orgId);
  }
}
