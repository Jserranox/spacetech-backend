import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { StorageService } from '../../knowledge/services/storage.service';

@Injectable()
export class StorageHealthIndicator {
  constructor(
    private readonly storageService: StorageService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  // Non-critical: never returns 'down' to avoid triggering 503.
  // Bucket unavailability is surfaced via available: false in metadata.
  async isHealthy(key = 'storage'): Promise<HealthIndicatorResult> {
    try {
      await this.storageService.checkBucket();
      return this.healthIndicatorService.check(key).up({ message: 'S3/MinIO bucket reachable' });
    } catch (err) {
      return this.healthIndicatorService.check(key).up({
        available: false,
        message: (err as Error).message,
      });
    }
  }
}
