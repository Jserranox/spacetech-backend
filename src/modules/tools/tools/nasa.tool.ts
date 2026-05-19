import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tool } from '../decorators/tool.decorator';
import { ITool, ToolParameterSchema } from '../interfaces/tool.interface';
import { IToolResult } from '../interfaces/tool-result.interface';

@Tool({ name: 'nasa_search', description: 'Busca imágenes, noticias y datos de la NASA' })
@Injectable()
export class NasaTool implements ITool {
  name = 'nasa_search';
  description = 'Busca imágenes, noticias y datos de la NASA';
  parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Término de búsqueda aeroespacial' },
      type: {
        type: 'string',
        enum: ['images', 'apod', 'neo'],
        description: 'Tipo de búsqueda',
      },
    },
    required: ['query', 'type'],
  };

  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NASA_API_KEY') || 'DEMO_KEY';
  }

  async execute(params: Record<string, unknown>): Promise<IToolResult> {
    const { query, type } = params as { query: string; type: string };
    const usingDemo = !this.configService.get<string>('NASA_API_KEY');
    const source = usingDemo ? 'nasa.gov (DEMO_KEY - rate limit reducido)' : 'nasa.gov';

    try {
      if (type === 'apod') {
        const res = await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${this.apiKey}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        return {
          success: true,
          data: { title: d.title, url: d.url, explanation: d.explanation, date: d.date },
          source,
        };
      }

      if (type === 'images') {
        const res = await fetch(
          `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        const items = (d.collection?.items || []).slice(0, 5).map((item: any) => ({
          title: item.data?.[0]?.title,
          description: item.data?.[0]?.description,
          url: item.links?.[0]?.href,
        }));
        return { success: true, data: items, source: 'images.nasa.gov' };
      }

      if (type === 'neo') {
        const res = await fetch(
          `https://api.nasa.gov/neo/rest/v1/feed?api_key=${this.apiKey}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        const nearEarth = d.near_earth_objects as Record<string, any[]>;
        const neos = Object.values(nearEarth)
          .flat()
          .slice(0, 5)
          .map((neo: any) => ({
            name: neo.name,
            hazardous: neo.is_potentially_hazardous_asteroid,
            estimatedDiameterKm: neo.estimated_diameter?.kilometers,
            closeApproachDate: neo.close_approach_data?.[0]?.close_approach_date,
          }));
        return { success: true, data: neos, source };
      }

      return { success: false, error: `Tipo '${type}' no soportado` };
    } catch (err) {
      return { success: false, error: (err as Error).message, source };
    }
  }
}
