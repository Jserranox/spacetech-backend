import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { IDocumentParser } from './parser.interface';

@Injectable()
export class UrlParser implements IDocumentParser {
  mimeTypes = ['text/html', 'text/url'];

  async parse(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header').remove();

    const text = $('article, main, .content, body').text();

    return text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50_000);
  }
}
