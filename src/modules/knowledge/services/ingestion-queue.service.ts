import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, JobName, IngestDocumentJob, IngestUrlJob } from '@aero-agent/queue';

@Injectable()
export class IngestionQueueService {
  constructor(
    @InjectQueue(QueueName.INGESTION) private readonly queue: Queue,
  ) {}

  async enqueueDocument(job: IngestDocumentJob): Promise<void> {
    await this.queue.add(JobName.INGEST_DOCUMENT, job, {
      jobId: job.documentId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async enqueueUrl(job: IngestUrlJob): Promise<void> {
    await this.queue.add(JobName.INGEST_URL, job, {
      jobId: job.documentId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  async getJobStatus(
    documentId: string,
  ): Promise<'waiting' | 'active' | 'completed' | 'failed' | 'unknown'> {
    const job = await this.queue.getJob(documentId);
    if (!job) return 'unknown';
    const state = await job.getState();
    const valid = ['waiting', 'active', 'completed', 'failed'] as const;
    return (valid as readonly string[]).includes(state)
      ? (state as 'waiting' | 'active' | 'completed' | 'failed')
      : 'unknown';
  }
}
