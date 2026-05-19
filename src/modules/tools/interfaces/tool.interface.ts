import { IToolResult } from './tool-result.interface';

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
}

export interface ITool {
  name: string;
  description: string;
  parameters: ToolParameterSchema;
  execute(params: Record<string, unknown>): Promise<IToolResult>;
}
