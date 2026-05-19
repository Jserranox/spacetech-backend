import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ITool } from '../interfaces/tool.interface';
import { TOOL_METADATA_KEY } from '../decorators/tool.decorator';

export const TOOLS_TOKEN = 'TOOLS_TOKEN';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly registry = new Map<string, ITool>();

  constructor(@Inject(TOOLS_TOKEN) private readonly tools: ITool[]) {}

  onModuleInit() {
    for (const tool of this.tools) {
      const meta = Reflect.getMetadata(TOOL_METADATA_KEY, tool.constructor);
      if (meta) {
        this.registry.set(meta.name, tool);
      }
    }
  }

  getAll(): ITool[] {
    return Array.from(this.registry.values());
  }

  getByName(name: string): ITool | undefined {
    return this.registry.get(name);
  }

  getSchemas() {
    return this.getAll().map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }
}
