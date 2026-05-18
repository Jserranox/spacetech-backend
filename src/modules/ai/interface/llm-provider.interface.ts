export interface ILlmProvider {
  generateStream(
    messages: { role: string; content: string }[],
    config: LlmConfig,
  ): AsyncIterable<string>;
}

export interface LlmConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  systemPrompt?: string;
}
