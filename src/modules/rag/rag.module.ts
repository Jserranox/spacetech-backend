import { Module } from '@nestjs/common';
import { RagService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { RetrievalService } from './services/retrieval.service';
import { ChunkingService } from './services/chunking.service';
import { RerankingService } from './services/reranking.service';

@Module({
  providers: [RagService, EmbeddingService, RetrievalService, ChunkingService, RerankingService]
})
export class RagModule {}
