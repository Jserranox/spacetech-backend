import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DocumentChunk } from '@aero-agent/database';
import { RAG_TOP_K, RAG_MIN_SIMILARITY } from '../constants/rag.constants';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async similaritySearch(
    queryEmbedding: number[],
    botId: string,
    topK: number = RAG_TOP_K,
    minSimilarity: number = RAG_MIN_SIMILARITY,
  ): Promise<{ chunk: DocumentChunk; similarity: number }[]> {
    const vectorStr = '[' + queryEmbedding.join(',') + ']';

    try {
      const rows = await this.dataSource.query<Record<string, unknown>[]>(
        `SELECT dc.*, 1 - (dc.embedding <=> $1::vector) AS similarity
         FROM document_chunks dc
         WHERE dc.bot_id = $2
           AND dc.deleted_at IS NULL
           AND 1 - (dc.embedding <=> $1::vector) >= $3
         ORDER BY dc.embedding <=> $1::vector
         LIMIT $4`,
        [vectorStr, botId, minSimilarity, topK],
      );

      return rows.map((row) => ({
        chunk: row as unknown as DocumentChunk,
        similarity: parseFloat(row['similarity'] as string),
      }));
    } catch (error) {
      this.logger.warn(
        'pgvector similarity search failed — pgvector extension may not be installed',
        (error as Error).message,
      );
      return [];
    }
  }
}
