import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { RetrievalService } from './retrieval.service';
import { RerankingService } from './reranking.service';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly retrievalService: RetrievalService,
    private readonly rerankingService: RerankingService,
  ) {}

  async retrieve(query: string, botId: string): Promise<string[]> {
    try {
      const queryEmbedding = await this.embeddingService.embed(query);
      const results = await this.retrievalService.similaritySearch(queryEmbedding, botId);
      if (!results.length) return [];
      const reranked = this.rerankingService.rerank(query, results);
      return reranked.map((chunk) => chunk.content);
    } catch (error) {
      this.logger.warn('RAG retrieve failed, returning empty context', (error as Error).message);
      return [];
    }
  }
}
