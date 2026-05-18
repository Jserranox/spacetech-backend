import { Injectable } from '@nestjs/common';
import { DocumentChunk } from '@aero-agent/database';

@Injectable()
export class RerankingService {
  rerank(
    query: string,
    chunks: { chunk: DocumentChunk; similarity: number }[],
  ): DocumentChunk[] {
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = chunks.map(({ chunk, similarity }) => {
      const content = chunk.content.toLowerCase();
      let score = similarity;
      for (const word of queryWords) {
        if (content.includes(word)) score += 0.05;
      }
      return { chunk, score };
    });

    return scored.sort((a, b) => b.score - a.score).map(({ chunk }) => chunk);
  }
}
