import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { IDocumentParser } from '../parsers/parser.interface';
import { PdfParser } from '../parsers/pdf.parser';
import { DocxParser } from '../parsers/docx.parser';
import { TxtParser } from '../parsers/txt.parser';
import { UrlParser } from '../parsers/url.parser';

@Injectable()
export class ExtractionService {
  private readonly parsers: IDocumentParser[];

  constructor(
    private readonly pdfParser: PdfParser,
    private readonly docxParser: DocxParser,
    private readonly txtParser: TxtParser,
    private readonly urlParser: UrlParser,
  ) {
    this.parsers = [pdfParser, docxParser, txtParser, urlParser];
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    const parser = this.parsers.find((p) => p.mimeTypes.includes(mimeType));
    if (!parser) {
      throw new UnprocessableEntityException('Formato no soportado');
    }
    return parser.parse(buffer);
  }

  async extractFromUrl(url: string): Promise<string> {
    const urlParser = this.parsers.find((p) =>
      p.mimeTypes.includes('text/url'),
    );
    if (!urlParser) {
      throw new UnprocessableEntityException('URL parser no disponible');
    }
    return urlParser.parse(url);
  }
}
