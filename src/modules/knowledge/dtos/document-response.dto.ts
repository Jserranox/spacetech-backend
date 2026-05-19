import { DocumentStatus, DocumentType, KnowledgeDocument } from '@aero-agent/database';

export class DocumentResponseDto {
  id: string;
  botId: string | null;
  organizationId: string;
  fileName: string;
  status: DocumentStatus;
  fileType: DocumentType;
  fileSizeBytes: number | null;
  sourceUrl: string | null;
  chunkCount: number;
  createdAt: Date;

  static fromEntity(doc: KnowledgeDocument): DocumentResponseDto {
    const dto = new DocumentResponseDto();
    dto.id = doc.id;
    dto.botId = doc.botId;
    dto.organizationId = doc.organizationId;
    dto.fileName = doc.originalName ?? doc.fileName;
    dto.status = doc.status;
    dto.fileType = doc.fileType;
    dto.fileSizeBytes = doc.fileSizeBytes;
    dto.sourceUrl = doc.sourceUrl;
    dto.chunkCount = doc.chunkCount;
    dto.createdAt = doc.createdAt;
    return dto;
  }
}
