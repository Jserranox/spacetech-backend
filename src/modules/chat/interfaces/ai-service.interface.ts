import { Bot } from '@aero-agent/database';

export interface IPromptContext {
  botConfig: Bot;
  conversationHistory: { role: string; content: string }[];
  userMessage: string;
  ragChunks?: string[];
}

export interface IAiService {
  generateStream(ctx: IPromptContext): AsyncIterable<string>;
}

export const AI_SERVICE_TOKEN = 'AI_SERVICE';
