import { Injectable } from '@nestjs/common';
import { IDocumentParser } from './parser.interface';

@Injectable()
export class TxtParser implements IDocumentParser {
  mimeTypes = ['text/plain', 'text/markdown'];

  async parse(input: Buffer): Promise<string> {
    return input.toString('utf-8');
  }
}
