import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotsModule } from '../bots/bots.module';
import { ToolsModule } from '../tools/tools.module';
import { AI_SERVICE_TOKEN } from '../chat/interfaces/ai-service.interface';
import { AiService } from './services/ai.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { LlmProviderFactory } from './llm-provider.factory';

@Module({
  imports: [ConfigModule, BotsModule, ToolsModule],
  providers: [
    AiService,
    PromptBuilderService,
    LlmProviderFactory,
    { provide: AI_SERVICE_TOKEN, useExisting: AiService },
  ],
  exports: [
    AiService,
    { provide: AI_SERVICE_TOKEN, useExisting: AiService },
  ],
})
export class AiModule {}
