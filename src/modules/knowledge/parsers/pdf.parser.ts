import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { IDocumentParser } from './parser.interface';

@Injectable()
export class PdfParser implements IDocumentParser {
  mimeTypes = ['application/pdf'];

  async parse(input: Buffer): Promise<string> {
    try {
      const result = await pdfParse(input);
      return result.text;
    } catch {
      throw new Error('PDF corrupto o protegido');
    }
  }
}
