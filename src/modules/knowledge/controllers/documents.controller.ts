import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../tenants/decorators/roles.decorator';
import { MemberRole } from '@aero-agent/database';
import { DocumentsService } from '../services/documents.service';
import { UploadService } from '../services/upload.service';
import { StorageService } from '../services/storage.service';
import { IngestionQueueService } from '../services/ingestion-queue.service';
import { UploadDocumentDto } from '../dtos/upload-document.dto';
import { IngestUrlDto } from '../dtos/ingest-url.dto';
import { QueryDocumentsDto } from '../dtos/query-documents.dto';
import { DocumentType } from '@aero-agent/database';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly uploadService: UploadService,
    private readonly storageService: StorageService,
    private readonly ingestionQueue: IngestionQueueService,
  ) {}

  @Post('upload')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.uploadService.processUpload(
      file,
      dto.botId,
      req.user.organizationId,
      dto,
    );
  }

  @Post('url')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  async ingestUrl(
    @Body() dto: IngestUrlDto,
    @Req() req: { user: JwtPayload },
  ) {
    const orgId = req.user.organizationId;

    const doc = await this.documentsService.create(dto.botId, orgId, {
      fileName: dto.title ?? dto.url,
      originalName: dto.title ?? dto.url,
      sourceUrl: dto.url,
      fileType: DocumentType.URL,
    });

    await this.ingestionQueue.enqueueUrl({
      documentId: doc.id,
      botId: dto.botId,
      organizationId: orgId,
      url: dto.url,
    });

    return doc;
  }

  @Get()
  async listDocuments(
    @Query() query: QueryDocumentsDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.documentsService.findAll(
      query.botId,
      req.user.organizationId,
      { page: query.page, limit: query.limit },
    );
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ) {
    const orgId = req.user.organizationId;
    const doc = await this.documentsService.findOne(id, orgId);
    await this.documentsService.softDelete(id, orgId);
    if (doc.storageKey) {
      await this.storageService.delete(doc.storageKey);
    }
  }
}
