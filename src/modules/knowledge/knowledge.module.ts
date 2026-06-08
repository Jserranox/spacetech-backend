import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { KnowledgeDocument, DocumentChunk } from '@aero-agent/database';
import { QueueName } from '@aero-agent/queue';
import { RagModule } from '../rag/rag.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AnalyticsModule } from '../analytics/analytics.module';

import { DocumentsController } from './controllers/documents.controller';
import { IngestionController } from './controllers/ingestion.controller';

import { DocumentsService } from './services/documents.service';
import { UploadService } from './services/upload.service';
import { StorageService } from './services/storage.service';
import { ExtractionService } from './services/extraction.service';
import { IngestionQueueService } from './services/ingestion-queue.service';

import { PdfParser } from './parsers/pdf.parser';
import { DocxParser } from './parsers/docx.parser';
import { TxtParser } from './parsers/txt.parser';
import { UrlParser } from './parsers/url.parser';
import { DOCUMENT_PARSERS } from './constants/knowledge.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeDocument, DocumentChunk]),
    BullModule.registerQueue({ name: QueueName.INGESTION }),
    RagModule,
    WebhooksModule,
    AnalyticsModule,
  ],
  controllers: [DocumentsController, IngestionController],
  providers: [
    DocumentsService,
    UploadService,
    StorageService,
    ExtractionService,
    IngestionQueueService,
    PdfParser,
    DocxParser,
    TxtParser,
    UrlParser,
    {
      provide: DOCUMENT_PARSERS,
      useFactory: (
        pdf: PdfParser,
        docx: DocxParser,
        txt: TxtParser,
        url: UrlParser,
      ) => [pdf, docx, txt, url],
      inject: [PdfParser, DocxParser, TxtParser, UrlParser],
    },
  ],
  exports: [DocumentsService, StorageService, ExtractionService],
})
export class KnowledgeModule {}
