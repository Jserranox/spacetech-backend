import { Injectable } from '@nestjs/common';
import { RAG_CHUNK_SIZE, RAG_CHUNK_OVERLAP } from '../constants/rag.constants';

@Injectable()
export class ChunkingService {
  chunkText(text: string, size = RAG_CHUNK_SIZE, overlap = RAG_CHUNK_OVERLAP): string[] {
    const chunks = this.splitRecursive(text, size);
    return this.addOverlap(chunks, overlap);
  }

  chunkDocument(content: string): { content: string; chunkIndex: number }[] {
    return this.chunkText(content).map((chunk, chunkIndex) => ({ content: chunk, chunkIndex }));
  }

  private splitRecursive(text: string, size: number): string[] {
    if (text.length <= size) return [text];

    const byParagraph = this.splitBy(text, '\n\n', size);
    if (byParagraph.length > 1) return byParagraph;

    const byLine = this.splitBy(text, '\n', size);
    if (byLine.length > 1) return byLine;

    const bySentence = this.splitBy(text, '. ', size);
    if (bySentence.length > 1) return bySentence;

    // Fixed-size fallback
    const fixed: string[] = [];
    for (let i = 0; i < text.length; i += size) {
      fixed.push(text.slice(i, i + size));
    }
    return fixed;
  }

  private splitBy(text: string, separator: string, size: number): string[] {
    const parts = text.split(separator);
    const chunks: string[] = [];
    let current = '';

    for (const part of parts) {
      const candidate = current ? current + separator + part : part;
      if (candidate.length <= size) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        if (part.length > size) {
          const sub = this.splitRecursive(part, size);
          chunks.push(...sub.slice(0, -1));
          current = sub[sub.length - 1];
        } else {
          current = part;
        }
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  private addOverlap(chunks: string[], overlap: number): string[] {
    if (overlap <= 0 || chunks.length <= 1) return chunks;
    return chunks.map((chunk, i) => {
      if (i === 0) return chunk;
      const tail = chunks[i - 1].slice(-overlap);
      return tail + chunk;
    });
  }
}
