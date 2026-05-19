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
  tools?: Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }>;
  tool_choice?: 'auto' | 'none' | 'required';
}
