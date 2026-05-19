import { Injectable, Inject, UnprocessableEntityException } from '@nestjs/common';
import { IDocumentParser } from '../parsers/parser.interface';
import { DOCUMENT_PARSERS } from '../constants/knowledge.constants';

@Injectable()
export class ExtractionService {
  constructor(
    @Inject(DOCUMENT_PARSERS) private readonly parsers: IDocumentParser[],
  ) {}

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    const parser = this.parsers.find((p) => p.mimeTypes.includes(mimeType));
    if (!parser) {
      throw new UnprocessableEntityException('Formato no soportado');
    }
    return parser.parse(buffer);
  }

  async extractFromUrl(url: string): Promise<string> {
    const urlParser = this.parsers.find((p) => p.mimeTypes.includes('text/url'));
    if (!urlParser) {
      throw new UnprocessableEntityException('URL parser no disponible');
    }
    return urlParser.parse(url);
  }
}
