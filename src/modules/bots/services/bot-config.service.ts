import { Injectable } from '@nestjs/common';
import { LlmProvider } from '@aero-agent/database';
import { isValidModel } from '../validators/bot-config.validator';

export interface LlmDefaults {
  temperature: number;
  maxTokens: number;
  topP: number;
}

const PROVIDER_DEFAULTS: Record<LlmProvider, LlmDefaults> = {
  [LlmProvider.OPENAI]:    { temperature: 0.7, maxTokens: 2048, topP: 1 },
  [LlmProvider.ANTHROPIC]: { temperature: 0.7, maxTokens: 4096, topP: 0.9 },
  [LlmProvider.GROQ]:      { temperature: 0.6, maxTokens: 8192, topP: 1 },
  [LlmProvider.OLLAMA]:    { temperature: 0.8, maxTokens: 2048, topP: 0.9 },
};

@Injectable()
export class BotConfigService {
  getDefaults(provider: LlmProvider): LlmDefaults {
    return PROVIDER_DEFAULTS[provider];
  }

  mergeDefaults(provider: LlmProvider, overrides?: Partial<LlmDefaults>): LlmDefaults {
    return { ...this.getDefaults(provider), ...overrides };
  }

  validateConfig(provider: LlmProvider, model: string): boolean {
    return isValidModel(provider, model);
  }
}
