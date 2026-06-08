import { registerAs } from '@nestjs/config';

export const llmConfig = registerAs('llm', () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? '',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  },
  nasa: {
    apiKey: process.env.NASA_API_KEY ?? 'DEMO_KEY',
  },
  serpapi: {
    apiKey: process.env.SERPAPI_KEY ?? '',
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 2048,
    topK: 5,
    minSimilarity: 0.72,
    contextMessages: 20,
  },
}));

export type LlmConfig = ReturnType<typeof llmConfig>;
