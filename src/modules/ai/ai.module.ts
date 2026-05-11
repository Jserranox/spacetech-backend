import { Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { LlmProviderService } from './services/llm-provider.service';
import { StreamingService } from './services/streaming.service';

@Module({
  providers: [AiService, PromptBuilderService, LlmProviderService, StreamingService]
})
export class AiModule {}
