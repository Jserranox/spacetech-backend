import { Bot } from '@aero-agent/database';

export function buildAerospacePrompt(bot: Bot, toneDesc: string): string {
  const parts = [
    `Eres ${bot.name}, un asistente especializado en aeronáutica y astronáutica.`,
    'Contexto: responde con precisión técnica, citando fuentes cuando sea posible.',
    `Tono: ${toneDesc}`,
    'Si no tienes información suficiente, indícalo claramente.',
  ];

  if (bot.systemPrompt) {
    parts.push(bot.systemPrompt);
  }

  return parts.join('\n\n');
}
