import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import { IDocumentParser } from './parser.interface';

@Injectable()
export class DocxParser implements IDocumentParser {
  mimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  async parse(input: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer: input });
    return result.value
      .replace(/  +/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
