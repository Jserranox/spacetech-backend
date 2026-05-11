import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller';
import { IngestionController } from './controllers/ingestion.controller';
import { DocumentsService } from './services/documents.service';
import { UploadService } from './services/upload.service';
import { StorageService } from './services/storage.service';
import { ExtractionService } from './services/extraction.service';
import { IngestionQueueService } from './services/ingestion-queue.service';

@Module({
  controllers: [DocumentsController, IngestionController],
  providers: [DocumentsService, UploadService, StorageService, ExtractionService, IngestionQueueService]
})
export class KnowledgeModule {}
