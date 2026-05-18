import { BotTone } from '@aero-agent/database';

export const TONE_DESCRIPTIONS: Record<BotTone, string> = {
  [BotTone.FORMAL]:
    'Usa lenguaje formal y técnico. Sé conciso y preciso.',
  [BotTone.FRIENDLY]:
    'Usa un tono amigable y accesible. Explica los conceptos complejos de forma sencilla.',
  [BotTone.TECHNICAL]:
    'Profundiza en los detalles técnicos. El usuario es un experto.',
  [BotTone.CASUAL]:
    'Usa un tono cercano y conversacional. Sé directo y evita formalismos innecesarios.',
};
