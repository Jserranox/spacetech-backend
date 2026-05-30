import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LlmHealthIndicator {
  constructor(
    private readonly configService: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'llm'): Promise<HealthIndicatorResult> {
    const configured: string[] = [];
    if (this.configService.get('OPENAI_API_KEY')) configured.push('openai');
    if (this.configService.get('ANTHROPIC_API_KEY')) configured.push('anthropic');
    if (this.configService.get('GROQ_API_KEY')) configured.push('groq');
    if (this.configService.get('OLLAMA_BASE_URL')) configured.push('ollama');

    return this.healthIndicatorService.check(key).up({
      message:
        configured.length > 0
          ? `${configured.length} provider(s) configured: ${configured.join(', ')}`
          : 'No LLM providers configured',
      providers: configured,
    });
  }
}
