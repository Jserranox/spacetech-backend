import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KnowledgeDocument,
  DocumentChunk,
  DocumentStatus,
} from '@aero-agent/database';
import { DocumentResponseDto } from '../dtos/document-response.dto';

export interface PaginatedDocuments {
  data: DocumentResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(KnowledgeDocument)
    private readonly docRepo: Repository<KnowledgeDocument>,
    @InjectRepository(DocumentChunk)
    private readonly chunkRepo: Repository<DocumentChunk>,
  ) {}

  async create(
    botId: string,
    orgId: string,
    data: Partial<KnowledgeDocument>,
  ): Promise<KnowledgeDocument> {
    const doc = this.docRepo.create({
      ...data,
      botId,
      organizationId: orgId,
      status: DocumentStatus.PENDING,
    });
    return this.docRepo.save(doc);
  }

  async update(id: string, data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    Object.assign(doc, data);
    return this.docRepo.save(doc);
  }

  async findAll(
    botId: string,
    orgId: string,
    query: { page?: number; limit?: number },
  ): Promise<PaginatedDocuments> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [docs, total] = await this.docRepo
      .createQueryBuilder('doc')
      .where('doc.botId = :botId AND doc.organizationId = :orgId', { botId, orgId })
      .orderBy('doc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: docs.map(DocumentResponseDto.fromEntity),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, orgId: string): Promise<KnowledgeDocument> {
    const doc = await this.docRepo.findOne({ where: { id, organizationId: orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async findOneRaw(id: string): Promise<KnowledgeDocument> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.chunkRepo.delete({ documentId: id });
    await this.docRepo.softDelete(id);
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    errorMessage?: string,
  ): Promise<KnowledgeDocument> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    doc.status = status;
    if (errorMessage !== undefined) doc.errorMessage = errorMessage ?? null;
    if (status === DocumentStatus.READY) doc.processedAt = new Date();
    return this.docRepo.save(doc);
  }
}
