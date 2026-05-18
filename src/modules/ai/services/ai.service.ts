import { Injectable } from '@nestjs/common';
import { IAiService, IPromptContext } from '../../chat/interfaces/ai-service.interface';
import { BotConfigService } from '../../bots/services/bot-config.service';
import { LlmProviderFactory } from '../llm-provider.factory';
import { PromptBuilderService } from './prompt-builder.service';
import { LlmConfig } from '../interface/llm-provider.interface';

@Injectable()
export class AiService implements IAiService {
  constructor(
    private readonly factory: LlmProviderFactory,
    private readonly promptBuilder: PromptBuilderService,
    private readonly botConfigService: BotConfigService,
  ) {}

  async *generateStream(ctx: IPromptContext): AsyncIterable<string> {
    const provider = this.factory.create(ctx.botConfig.llmProvider);
    const messages = this.promptBuilder.buildMessages(ctx);
    const defaults = this.botConfigService.mergeDefaults(ctx.botConfig.llmProvider, {
      temperature: ctx.botConfig.temperature,
      maxTokens: ctx.botConfig.maxTokens,
    });
    const config: LlmConfig = {
      model: ctx.botConfig.llmModel,
      ...defaults,
      systemPrompt: this.promptBuilder.buildSystemPrompt(ctx.botConfig),
    };

    yield* provider.generateStream(messages, config);
  }

  async generateResponse(ctx: IPromptContext): Promise<string> {
    let result = '';
    for await (const chunk of this.generateStream(ctx)) {
      result += chunk;
    }
    return result;
  }
}
