import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '../decorators/tool.decorator';
import { ITool, ToolParameterSchema } from '../interfaces/tool.interface';
import { IToolResult } from '../interfaces/tool-result.interface';

@Tool({ name: 'esa_missions', description: 'Consulta misiones y datos de la Agencia Espacial Europea' })
@Injectable()
export class EsaTool implements ITool {
  name = 'esa_missions';
  description = 'Consulta misiones y datos de la Agencia Espacial Europea';
  parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Nombre de misión o tema' },
      category: {
        type: 'string',
        enum: ['missions', 'news', 'science'],
        description: 'Categoría',
      },
    },
    required: ['query'],
  };

  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('ESA_BASE_URL') || 'https://esasky.esac.esa.int';
  }

  async execute(params: Record<string, unknown>): Promise<IToolResult> {
    const { query } = params as { query: string; category?: string };
    const source = 'esa.int';

    try {
      const adql = encodeURIComponent(
        `SELECT TOP 10 * FROM mv_v_esasky_missions WHERE mission_name LIKE '%${query}%'`,
      );
      const url = `${this.baseUrl}/tap/sync?REQUEST=doQuery&LANG=ADQL&FORMAT=json&QUERY=${adql}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, data, source };
    } catch {
      return { success: false, error: 'ESA API no disponible', source };
    }
  }
}
