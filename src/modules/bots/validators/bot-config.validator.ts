import { LlmProvider } from '@aero-agent/database';

export const MODEL_MAP: Record<LlmProvider, string[]> = {
  [LlmProvider.OPENAI]: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  [LlmProvider.ANTHROPIC]: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  [LlmProvider.GROQ]: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  [LlmProvider.OLLAMA]: ['llama3', 'mistral', 'phi3', 'gemma2'],
};

export function isValidModel(provider: LlmProvider, model: string): boolean {
  return MODEL_MAP[provider]?.includes(model) ?? false;
}
