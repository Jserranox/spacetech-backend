import { Injectable } from '@nestjs/common';
import { Bot, BotTone } from '@aero-agent/database';
import { IPromptContext } from '../../chat/interfaces/ai-service.interface';
import { buildAerospacePrompt } from '../templates/system-prompt.template';
import { TONE_DESCRIPTIONS } from '../templates/tone-descriptions';

const MAX_CONTEXT_TOKENS = 6000;
const CHARS_PER_TOKEN = 4;

@Injectable()
export class PromptBuilderService {
  buildSystemPrompt(bot: Bot): string {
    const toneDesc = TONE_DESCRIPTIONS[bot.tone] ?? TONE_DESCRIPTIONS[BotTone.FORMAL];
    return buildAerospacePrompt(bot, toneDesc);
  }

  buildMessages(ctx: IPromptContext): { role: string; content: string }[] {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: this.buildSystemPrompt(ctx.botConfig) },
      ...ctx.conversationHistory,
    ];

    if (ctx.ragChunks && ctx.ragChunks.length > 0) {
      const ragContent = `Contexto relevante:\n\n${ctx.ragChunks.join('\n\n')}`;
      messages.push({ role: 'system', content: ragContent });
    }

    messages.push({ role: 'user', content: ctx.userMessage });

    return this.truncateToTokenLimit(messages, MAX_CONTEXT_TOKENS);
  }

  truncateToTokenLimit(
    messages: { role: string; content: string }[],
    maxTokens: number,
  ): { role: string; content: string }[] {
    const estimate = (m: { content: string }) =>
      Math.ceil(m.content.length / CHARS_PER_TOKEN);

    if (messages.reduce((s, m) => s + estimate(m), 0) <= maxTokens) {
      return messages;
    }

    const result = [...messages];
    // Trim from index 1 to preserve the system prompt (index 0) and user message (last)
    while (result.reduce((s, m) => s + estimate(m), 0) > maxTokens && result.length > 2) {
      result.splice(1, 1);
    }

    return result;
  }
}
