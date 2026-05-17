import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as passport from 'passport';
import { ApiKey } from '@aero-agent/database';
import { API_KEY_STRATEGY, API_KEY_PREFIX } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Passport strategy that authenticates via X-API-Key or "ApiKey <token>" Authorization header.
 * Key format: aero_<entityId>.<randomSecret>
 */
class HeaderApiKeyPassportStrategy implements passport.Strategy {
  readonly name = API_KEY_STRATEGY;

  constructor(
    private readonly validateFn: (rawKey: string) => Promise<JwtPayload | null>,
  ) {}

  authenticate(this: any, req: Request): void {
    const rawKey =
      (req.headers['x-api-key'] as string | undefined) ||
      (req.headers.authorization?.startsWith('ApiKey ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (!rawKey) {
      this.fail({ message: 'API key missing' }, 401);
      return;
    }

    this.validateFn(rawKey)
      .then((user) => {
        if (!user) {
          this.fail({ message: 'Invalid API key' }, 401);
        } else {
          this.success(user);
        }
      })
      .catch((err: Error) => this.error(err));
  }
}

@Injectable()
export class ApiKeyStrategy {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {
    passport.use(new HeaderApiKeyPassportStrategy(this.validate.bind(this)));
  }

  private async validate(rawKey: string): Promise<JwtPayload | null> {
    if (!rawKey.startsWith(API_KEY_PREFIX)) return null;

    const withoutPrefix = rawKey.slice(API_KEY_PREFIX.length);
    const dotIndex = withoutPrefix.indexOf('.');
    if (dotIndex === -1) return null;

    const keyId = withoutPrefix.slice(0, dotIndex);
    const secret = withoutPrefix.slice(dotIndex + 1);

    if (!keyId || !secret) return null;

    const apiKey = await this.apiKeyRepo.findOne({
      where: { id: keyId, isActive: true },
    });

    if (!apiKey) return null;

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    const isValid = await bcrypt.compare(secret, apiKey.keyHash);
    if (!isValid) return null;

    // Fire-and-forget usage stats update
    this.apiKeyRepo
      .update(keyId, {
        lastUsedAt: new Date(),
        usageCount: apiKey.usageCount + 1,
      })
      .catch(() => undefined);

    return {
      sub: keyId,
      email: '',
      organizationId: apiKey.organizationId,
      role: 'api-key',
    };
  }
}
