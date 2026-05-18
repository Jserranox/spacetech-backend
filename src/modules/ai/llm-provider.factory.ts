import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from '@aero-agent/database';
import { ILlmProvider } from './interface/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GroqProvider } from './providers/groq.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Injectable()
export class LlmProviderFactory {
  private readonly cache = new Map<LlmProvider, ILlmProvider>();

  constructor(private readonly config: ConfigService) {}

  create(provider: LlmProvider): ILlmProvider {
    if (this.cache.has(provider)) {
      return this.cache.get(provider)!;
    }
    const instance = this.buildProvider(provider);
    this.cache.set(provider, instance);
    return instance;
  }

  private buildProvider(provider: LlmProvider): ILlmProvider {
    switch (provider) {
      case LlmProvider.OPENAI: {
        const apiKey = this.config.get<string>('OPENAI_API_KEY');
        if (!apiKey) throw new InternalServerErrorException('OPENAI_API_KEY is not configured');
        return new OpenAIProvider(apiKey);
      }
      case LlmProvider.ANTHROPIC: {
        const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
        if (!apiKey) throw new InternalServerErrorException('ANTHROPIC_API_KEY is not configured');
        return new AnthropicProvider(apiKey);
      }
      case LlmProvider.GROQ: {
        const apiKey = this.config.get<string>('GROQ_API_KEY');
        if (!apiKey) throw new InternalServerErrorException('GROQ_API_KEY is not configured');
        return new GroqProvider(apiKey);
      }
      case LlmProvider.OLLAMA: {
        const baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ?? 'http://localhost:11434';
        return new OllamaProvider(baseUrl);
      }
      default:
        throw new InternalServerErrorException(`Unknown LLM provider: ${provider}`);
    }
  }
}
