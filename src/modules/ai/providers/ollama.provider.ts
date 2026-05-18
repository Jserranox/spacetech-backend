import { Ollama } from 'ollama';
import { ILlmProvider, LlmConfig } from '../interface/llm-provider.interface';

export class OllamaProvider implements ILlmProvider {
  private readonly client: Ollama;

  constructor(baseUrl: string) {
    this.client = new Ollama({ host: baseUrl });
  }

  async *generateStream(
    messages: { role: string; content: string }[],
    config: LlmConfig,
  ): AsyncIterable<string> {
    const stream = await this.client.chat({
      model: config.model,
      messages: messages as { role: string; content: string }[],
      stream: true,
      options: {
        temperature: config.temperature,
        top_p: config.topP,
        num_predict: config.maxTokens,
      },
    });

    for await (const chunk of stream) {
      const content = chunk.message?.content ?? '';
      if (content) yield content;
    }
  }
}
