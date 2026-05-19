import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from '../../tenants/decorators/roles.decorator';
import { MemberRole, DocumentStatus, DocumentType } from '@aero-agent/database';
import { DocumentsService } from '../services/documents.service';
import { IngestionQueueService } from '../services/ingestion-queue.service';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Controller('documents')
export class IngestionController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly ingestionQueue: IngestionQueueService,
  ) {}

  @Get(':id/status')
  async getStatus(
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ) {
    const document = await this.documentsService.findOne(id, req.user.organizationId);
    const jobStatus = await this.ingestionQueue.getJobStatus(id);
    return { document, jobStatus };
  }

  @Post(':id/reprocess')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.ACCEPTED)
  async reprocess(
    @Param('id') id: string,
    @Req() req: { user: JwtPayload },
  ) {
    const orgId = req.user.organizationId;
    const doc = await this.documentsService.findOne(id, orgId);
    await this.documentsService.updateStatus(id, DocumentStatus.PENDING);

    if (doc.fileType === DocumentType.URL && doc.sourceUrl) {
      await this.ingestionQueue.enqueueUrl({
        documentId: doc.id,
        botId: doc.botId ?? '',
        organizationId: orgId,
        url: doc.sourceUrl,
      });
    } else {
      await this.ingestionQueue.enqueueDocument({
        documentId: doc.id,
        botId: doc.botId ?? '',
        organizationId: orgId,
        storageKey: doc.storageKey ?? '',
        fileType: doc.fileType,
      });
    }

    return { message: 'Reprocessing enqueued', documentId: id };
  }
}
