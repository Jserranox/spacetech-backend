import Groq from 'groq-sdk';
import { ILlmProvider, LlmConfig } from '../interface/llm-provider.interface';

export class GroqProvider implements ILlmProvider {
  private readonly client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async *generateStream(
    messages: { role: string; content: string }[],
    config: LlmConfig,
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as Groq.Chat.ChatCompletionMessageParam[],
      stream: true,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      ...(config.topP !== undefined && { top_p: config.topP }),
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? '';
      if (content) yield content;
    }
  }
}
