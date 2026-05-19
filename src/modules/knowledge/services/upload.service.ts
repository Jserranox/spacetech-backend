import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KnowledgeDocument } from '@aero-agent/database';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage.service';
import { IngestionQueueService } from './ingestion-queue.service';
import { ALLOWED_MIME_TYPES, MIME_TO_DOCTYPE } from '../constants/knowledge.constants';
import { UploadDocumentDto } from '../dtos/upload-document.dto';

@Injectable()
export class UploadService {
  private readonly maxFileSize: number;

  constructor(
    private readonly config: ConfigService,
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
    private readonly ingestionQueue: IngestionQueueService,
  ) {
    const maxMb = parseInt(config.get<string>('MAX_FILE_SIZE_MB') ?? '20', 10);
    this.maxFileSize = maxMb * 1024 * 1024;
  }

  validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`);
    }
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('El archivo supera el tamaño máximo permitido');
    }
  }

  async processUpload(
    file: Express.Multer.File,
    botId: string,
    orgId: string,
    dto: UploadDocumentDto,
  ): Promise<KnowledgeDocument> {
    this.validateFile(file);

    const doc = await this.documentsService.create(botId, orgId, {
      fileName: file.originalname,
      originalName: dto.title ?? file.originalname,
      fileType: MIME_TO_DOCTYPE[file.mimetype],
    });

    const key = this.storageService.buildKey(orgId, doc.id, file.originalname);
    await this.storageService.upload(key, file.buffer, file.mimetype);

    const updated = await this.documentsService.update(doc.id, {
      storageKey: key,
      fileSizeBytes: file.size,
    });

    await this.ingestionQueue.enqueueDocument({
      documentId: doc.id,
      botId,
      organizationId: orgId,
      storageKey: key,
      fileType: file.mimetype,
    });

    return updated;
  }
}
