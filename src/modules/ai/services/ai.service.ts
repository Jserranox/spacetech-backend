import { Injectable } from '@nestjs/common';
import { IAiService, IPromptContext } from '../../chat/interfaces/ai-service.interface';
import { BotConfigService } from '../../bots/services/bot-config.service';
import { LlmProviderFactory } from '../llm-provider.factory';
import { PromptBuilderService } from './prompt-builder.service';
import { LlmConfig } from '../interface/llm-provider.interface';
import { ToolsService } from '../../tools/services/tools.service';
import { ToolRegistryService } from '../../tools/services/tool-registry.service';

@Injectable()
export class AiService implements IAiService {
  constructor(
    private readonly factory: LlmProviderFactory,
    private readonly promptBuilder: PromptBuilderService,
    private readonly botConfigService: BotConfigService,
    private readonly toolsService: ToolsService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  private buildConfig(ctx: IPromptContext, extra?: Partial<LlmConfig>): LlmConfig {
    const defaults = this.botConfigService.mergeDefaults(ctx.botConfig.llmProvider, {
      temperature: ctx.botConfig.temperature,
      maxTokens: ctx.botConfig.maxTokens,
    });
    return {
      model: ctx.botConfig.llmModel,
      ...defaults,
      systemPrompt: this.promptBuilder.buildSystemPrompt(ctx.botConfig),
      ...extra,
    };
  }

  async *generateStream(ctx: IPromptContext): AsyncIterable<string> {
    const provider = this.factory.create(ctx.botConfig.llmProvider);
    const messages = this.promptBuilder.buildMessages(ctx);
    const config = this.buildConfig(ctx);
    yield* provider.generateStream(messages, config);
  }

  async generateResponse(ctx: IPromptContext): Promise<string> {
    let result = '';
    for await (const chunk of this.generateStream(ctx)) {
      result += chunk;
    }
    return result;
  }

  async *generateWithTools(ctx: IPromptContext): AsyncIterable<string> {
    const schemas = this.toolRegistry.getSchemas();
    const provider = this.factory.create(ctx.botConfig.llmProvider);
    const messages = this.promptBuilder.buildMessages(ctx);
    const config = this.buildConfig(ctx, { tools: schemas, tool_choice: 'auto' });

    // First pass — accumulate response to detect tool calls
    let firstResponse = '';
    for await (const chunk of provider.generateStream(messages, config)) {
      firstResponse += chunk;
    }

    // Try to parse structured tool calls from the response
    let toolCalls: Array<{ name: string; arguments: string | Record<string, unknown> }> | null = null;
    try {
      const parsed = JSON.parse(firstResponse) as { tool_calls?: typeof toolCalls };
      if (Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
        toolCalls = parsed.tool_calls;
      }
    } catch {
      // Plain text response — no tool calls
    }

    if (!toolCalls || toolCalls.length === 0) {
      yield firstResponse;
      return;
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      toolCalls.map((tc) => this.toolsService.executeFromLlmCall(JSON.stringify(tc))),
    );

    // Rebuild context with assistant + tool result messages
    const updatedHistory = [
      ...ctx.conversationHistory,
      { role: 'assistant', content: firstResponse },
      ...toolResults.map((result, i) => ({
        role: 'tool',
        content: JSON.stringify(result),
        name: (toolCalls![i] as any).name,
      })),
    ];

    yield* this.generateStream({ ...ctx, conversationHistory: updatedHistory });
  }
}
