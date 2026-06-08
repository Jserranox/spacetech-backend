import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  timingSafeEqual,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SignatureService {
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const hexKey = this.configService.get<string>('WEBHOOK_ENCRYPTION_KEY', '');
    this.encryptionKey = hexKey
      ? Buffer.from(hexKey, 'hex')
      : randomBytes(32);
  }

  sign(payload: string, secret: string): string {
    return 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
  }

  verify(payload: string, signature: string, secret: string): boolean {
    const expected = Buffer.from(this.sign(payload, secret));
    const received = Buffer.from(signature);
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  }

  generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  encryptSecret(secret: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = (cipher as any).getAuthTag() as Buffer;
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decryptSecret(encryptedSecret: string): string {
    const [ivHex, tagHex, encryptedHex] = encryptedSecret.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    (decipher as any).setAuthTag(tag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  }

  async hashSecret(secret: string): Promise<string> {
    return bcrypt.hash(secret, 10);
  }

  async compareSecret(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }
}
