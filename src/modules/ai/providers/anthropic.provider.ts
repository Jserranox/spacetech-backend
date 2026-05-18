import Anthropic from '@anthropic-ai/sdk';
import { ILlmProvider, LlmConfig } from '../interface/llm-provider.interface';

export class AnthropicProvider implements ILlmProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *generateStream(
    messages: { role: string; content: string }[],
    config: LlmConfig,
  ): AsyncIterable<string> {
    const userMessages = messages.filter(
      (m) => m.role !== 'system',
    ) as Anthropic.MessageParam[];

    const stream = this.client.messages.stream({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: userMessages,
      ...(config.systemPrompt && { system: config.systemPrompt }),
      temperature: config.temperature,
      ...(config.topP !== undefined && { top_p: config.topP }),
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}
