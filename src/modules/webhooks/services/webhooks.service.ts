import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '@aero-agent/database';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { SignatureService } from './signature.service';
import { WebhookEventType } from '../constants/webhook-events.constants';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
    private readonly signatureService: SignatureService,
  ) {}

  async create(
    orgId: string,
    dto: CreateWebhookDto,
  ): Promise<{ webhook: Webhook; rawSecret: string }> {
    const rawSecret = this.signatureService.generateSecret();
    const signingSecret = this.signatureService.encryptSecret(rawSecret);

    const webhook = this.webhookRepo.create({
      organizationId: orgId,
      url: dto.url,
      events: dto.events,
      botId: dto.botId ?? null,
      customHeaders: dto.customHeaders ?? null,
      signingSecret,
      isActive: true,
    });

    const saved = await this.webhookRepo.save(webhook);
    return { webhook: saved, rawSecret };
  }

  async findAll(orgId: string): Promise<Webhook[]> {
    return this.webhookRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, orgId: string): Promise<Webhook> {
    const webhook = await this.webhookRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return webhook;
  }

  async update(id: string, orgId: string, dto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.findOne(id, orgId);
    if (dto.url !== undefined) webhook.url = dto.url;
    if (dto.events !== undefined) webhook.events = dto.events;
    if (dto.botId !== undefined) webhook.botId = dto.botId ?? null;
    if (dto.customHeaders !== undefined) webhook.customHeaders = dto.customHeaders ?? null;
    if (dto.isActive !== undefined) webhook.isActive = dto.isActive;
    return this.webhookRepo.save(webhook);
  }

  async toggleActive(id: string, orgId: string, isActive: boolean): Promise<Webhook> {
    const webhook = await this.findOne(id, orgId);
    webhook.isActive = isActive;
    return this.webhookRepo.save(webhook);
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    await this.findOne(id, orgId);
    await this.webhookRepo.softDelete(id);
  }

  async findActiveByOrgAndEvent(orgId: string, event: WebhookEventType): Promise<Webhook[]> {
    return this.webhookRepo
      .createQueryBuilder('w')
      .where('w.organizationId = :orgId', { orgId })
      .andWhere('w.isActive = true')
      .andWhere('w.deletedAt IS NULL')
      .andWhere('w.events @> ARRAY[:event]::text[]', { event })
      .getMany();
  }

  async updateDeliveryStats(id: string, success: boolean, statusCode: number): Promise<void> {
    await this.webhookRepo.increment({ id }, 'totalDeliveries', 1);
    if (!success) {
      await this.webhookRepo.increment({ id }, 'failedDeliveries', 1);
    }
    await this.webhookRepo.update(id, {
      lastDeliveredAt: new Date(),
      lastStatusCode: statusCode,
    });
  }
}
