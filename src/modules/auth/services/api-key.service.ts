import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ApiKey } from '@aero-agent/database';
import { CreateApiKeyDto } from '../dtos/create-api-key.dto';
import { ApiKeyResponseDto } from '../dtos/auth-response.dto';
import { API_KEY_PREFIX, BCRYPT_SALT_ROUNDS } from '../constants/auth.constants';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async create(organizationId: string, dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    // Generate 32-byte cryptographically random secret
    const secret = crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(secret, BCRYPT_SALT_ROUNDS);

    const entity = this.apiKeyRepo.create({
      organizationId,
      name: dto.name,
      keyHash,
      keyPreview: 'pending',
      scopes: dto.scopes ?? [],
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    const saved = await this.apiKeyRepo.save(entity);

    // Full key format: aero_<uuid>.<secret>
    const fullKey = `${API_KEY_PREFIX}${saved.id}.${secret}`;
    const keyPreview = fullKey.slice(0, 16) + '...';

    await this.apiKeyRepo.update(saved.id, { keyPreview });

    return {
      id: saved.id,
      name: saved.name,
      key: fullKey,
      keyPreview,
      scopes: saved.scopes,
      expiresAt: saved.expiresAt,
      createdAt: saved.createdAt,
    };
  }

  async listForUser(organizationId: string): Promise<Partial<ApiKey>[]> {
    return this.apiKeyRepo.find({
      where: { organizationId, isActive: true },
      select: [
        'id',
        'name',
        'keyPreview',
        'scopes',
        'lastUsedAt',
        'usageCount',
        'expiresAt',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    const key = await this.apiKeyRepo.findOne({ where: { id, organizationId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.apiKeyRepo.update(id, { isActive: false });
  }
}
