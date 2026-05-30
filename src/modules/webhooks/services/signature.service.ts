import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  timingSafeEqual,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'crypto';

@Injectable()
export class SignatureService {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const hexKey = this.config.get<string>('WEBHOOK_ENCRYPTION_KEY', '');
    this.key = Buffer.from(hexKey.padEnd(64, '0'), 'hex');
  }

  sign(payload: string, rawSecret: string): string {
    return 'sha256=' + createHmac('sha256', rawSecret).update(payload).digest('hex');
  }

  verify(payload: string, signature: string, rawSecret: string): boolean {
    const expected = this.sign(payload, rawSecret);
    try {
      return timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expected, 'utf8'),
      );
    } catch {
      return false;
    }
  }

  generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  encryptSecret(rawSecret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(rawSecret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decryptSecret(encryptedSecret: string): string {
    const parts = encryptedSecret.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  }
}
