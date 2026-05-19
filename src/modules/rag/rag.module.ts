import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { RetrievalService } from './services/retrieval.service';
import { ChunkingService } from './services/chunking.service';
import { RerankingService } from './services/reranking.service';

@Module({
  imports: [ConfigModule],
  providers: [RagService, EmbeddingService, RetrievalService, ChunkingService, RerankingService],
  exports: [RagService, ChunkingService, EmbeddingService],
})
export class RagModule {}
