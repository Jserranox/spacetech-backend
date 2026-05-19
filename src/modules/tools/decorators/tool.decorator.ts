export const TOOL_METADATA_KEY = 'tool:metadata';

export function Tool(meta: { name: string; description: string }): ClassDecorator {
  return (target) => Reflect.defineMetadata(TOOL_METADATA_KEY, meta, target);
}
