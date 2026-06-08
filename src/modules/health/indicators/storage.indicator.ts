import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { StorageService } from '../../knowledge/services/storage.service';

@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(private readonly storageService: StorageService) {
    super();
  }

  async isHealthy(key = 'storage'): Promise<HealthIndicatorResult> {
    try {
      await this.storageService.checkBucket();
      return this.getStatus(key, true, { message: 'S3/MinIO bucket reachable' });
    } catch (err) {
      // Non-critical: return 'up' with degraded flag so readiness stays 200
      return this.getStatus(key, true, {
        degraded: true,
        message: err instanceof Error ? err.message : 'unavailable',
      });
    }
  }
}
