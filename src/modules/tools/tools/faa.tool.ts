import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '../decorators/tool.decorator';
import { ITool, ToolParameterSchema } from '../interfaces/tool.interface';
import { IToolResult } from '../interfaces/tool-result.interface';

@Tool({ name: 'faa_airspace', description: 'Consulta NOTAMs y restricciones de espacio aéreo FAA' })
@Injectable()
export class FaaTool implements ITool {
  name = 'faa_airspace';
  description = 'Consulta NOTAMs y restricciones de espacio aéreo FAA';
  parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'Código ICAO del aeropuerto o coordenadas' },
      type: {
        type: 'string',
        enum: ['notam', 'airspace', 'airport'],
        description: 'Tipo de consulta',
      },
    },
    required: ['location', 'type'],
  };

  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('FAA_BASE_URL') || 'https://external-api.faa.gov';
  }

  async execute(params: Record<string, unknown>): Promise<IToolResult> {
    const { location, type } = params as { location: string; type: string };
    const headers = { Accept: 'application/json' };
    const source = 'faa.gov';

    let url: string;
    if (type === 'notam') {
      url = `${this.baseUrl}/notamapi/notams?icaoLocation=${encodeURIComponent(location)}`;
    } else if (type === 'airport') {
      url = `${this.baseUrl}/airport/${encodeURIComponent(location)}`;
    } else {
      url = `${this.baseUrl}/uwm/api/airspace/classification/${encodeURIComponent(location)}`;
    }

    try {
      const res = await fetch(url, { headers });
      if (res.status === 404) {
        return { success: true, data: [], source };
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, data, source };
    } catch (err) {
      return { success: false, error: (err as Error).message, source };
    }
  }
}
