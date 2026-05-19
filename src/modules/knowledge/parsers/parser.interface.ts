export interface IDocumentParser {
  mimeTypes: string[];
  parse(input: Buffer | string): Promise<string>;
}
