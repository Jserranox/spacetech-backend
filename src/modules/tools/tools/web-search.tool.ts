import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '../decorators/tool.decorator';
import { ITool, ToolParameterSchema } from '../interfaces/tool.interface';
import { IToolResult } from '../interfaces/tool-result.interface';

@Tool({ name: 'web_search', description: 'Realiza búsqueda web para información aeroespacial actualizada' })
@Injectable()
export class WebSearchTool implements ITool {
  name = 'web_search';
  description = 'Realiza búsqueda web para información aeroespacial actualizada';
  parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Consulta de búsqueda' },
      num: {
        type: 'string',
        description: 'Número de resultados (1-10)',
        enum: ['3', '5', '10'],
      },
    },
    required: ['query'],
  };

  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SERPAPI_KEY');
  }

  async execute(params: Record<string, unknown>): Promise<IToolResult> {
    const { query, num = '5' } = params as { query: string; num?: string };

    if (!this.apiKey) {
      return { success: false, error: 'Web search no configurado (SERPAPI_KEY faltante)' };
    }

    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${num}&api_key=${this.apiKey}&hl=es&gl=us`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const count = parseInt(num, 10);
      const results = ((data.organic_results as any[]) || [])
        .slice(0, count)
        .map((r) => ({ title: r.title, link: r.link, snippet: r.snippet }));
      return { success: true, data: results, source: 'serpapi.com' };
    } catch (err) {
      return { success: false, error: (err as Error).message, source: 'serpapi.com' };
    }
  }
}
