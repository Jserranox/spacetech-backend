import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent } from '@aero-agent/database';
import { SignatureService } from './signature.service';
import { CreateWebhookDto } from '../dtos/create-webhook.dto';
import { UpdateWebhookDto } from '../dtos/update-webhook.dto';

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

  async findActiveByOrgAndEvent(orgId: string, event: WebhookEvent): Promise<Webhook[]> {
    return this.webhookRepo
      .createQueryBuilder('webhook')
      .where('webhook.organizationId = :orgId', { orgId })
      .andWhere('webhook.isActive = true')
      .andWhere(':event = ANY(webhook.events)', { event })
      .getMany();
  }

  async updateDelivery(
    id: string,
    orgId: string,
    statusCode: number | null,
    success: boolean,
  ): Promise<void> {
    await this.webhookRepo.increment({ id, organizationId: orgId }, 'totalDeliveries', 1);
    if (!success) {
      await this.webhookRepo.increment({ id, organizationId: orgId }, 'failedDeliveries', 1);
    }
    await this.webhookRepo.update(
      { id, organizationId: orgId },
      { lastDeliveredAt: new Date(), lastStatusCode: statusCode },
    );
  }
}
