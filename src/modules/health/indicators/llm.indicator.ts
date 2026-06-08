import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class LlmHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key = 'llm'): Promise<HealthIndicatorResult> {
    const configured: string[] = [];
    if (this.configService.get<string>('OPENAI_API_KEY')) configured.push('openai');
    if (this.configService.get<string>('ANTHROPIC_API_KEY')) configured.push('anthropic');
    if (this.configService.get<string>('GROQ_API_KEY')) configured.push('groq');
    if (this.configService.get<string>('OLLAMA_BASE_URL')) configured.push('ollama');

    const hasProviders = configured.length > 0;
    // Non-critical: always 'up' — LLM config doesn't block readiness
    return this.getStatus(key, true, {
      configured: hasProviders,
      message: hasProviders
        ? `${configured.length} provider(s) configured: ${configured.join(', ')}`
        : 'No LLM providers configured',
      providers: configured,
    });
  }
}
