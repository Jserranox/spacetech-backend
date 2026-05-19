import { Injectable } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';
import { IToolResult } from '../interfaces/tool-result.interface';

@Injectable()
export class ToolsService {
  constructor(private readonly registry: ToolRegistryService) {}

  async execute(name: string, params: Record<string, unknown>): Promise<IToolResult> {
    const tool = this.registry.getByName(name);
    if (!tool) {
      return { success: false, error: `Tool '${name}' no registrada` };
    }

    for (const required of tool.parameters.required) {
      if (params[required] === undefined || params[required] === null) {
        return { success: false, error: `Parámetro requerido '${required}' faltante` };
      }
    }

    try {
      return await tool.execute(params);
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async executeFromLlmCall(toolCallJson: string): Promise<IToolResult> {
    try {
      const parsed = JSON.parse(toolCallJson) as { name: string; arguments: string | Record<string, unknown> };
      const args =
        typeof parsed.arguments === 'string'
          ? (JSON.parse(parsed.arguments) as Record<string, unknown>)
          : parsed.arguments;
      return await this.execute(parsed.name, args);
    } catch (err) {
      return { success: false, error: `Error parseando llamada de herramienta: ${(err as Error).message}` };
    }
  }
}
