import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RETROACTIVE_EDUCATION_LICENSE_QUEUE } from '../../common/queues/queue.constants';
import { LoggingService } from '../../logs/logs.service';

/**
 * Publisher for Retroactive Education-License Queue
 * Single Responsibility: Handle all queue publishing for retroactive education-license processing
 */
@Injectable()
export class RetroactiveEducationLicenseQueuePublisher {
  constructor(
    @InjectQueue(RETROACTIVE_EDUCATION_LICENSE_QUEUE)
    private readonly queue: Queue,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Publish job for retroactive processing when mapping is created/updated
   * @param mappingId - The education-license mapping ID
   */
  async publishMappingJob(mappingId: string): Promise<void> {
    try {
      await this.queue.add(RETROACTIVE_EDUCATION_LICENSE_QUEUE, {
        mappingId,
      });
    } catch (error) {
      this.logger.error(
        'Error publishing retroactive education-license mapping job',
        'retroactive-education-license-publisher',
        error?.stack || error?.message || String(error),
        {
          error: error?.message || String(error),
          mappingId,
        },
      );
      throw error;
    }
  }

  /**
   * Publish job for retroactive processing when user certificate is created
   * @param userId - The user ID
   * @param licenseId - The license ID from the certificate
   */
  async publishCertificateJob(userId: string, licenseId: string): Promise<void> {
    try {
      await this.queue.add(RETROACTIVE_EDUCATION_LICENSE_QUEUE, {
        userId,
        licenseId,
      });
    } catch (error) {
      this.logger.error(
        'Error publishing retroactive education-license certificate job',
        'retroactive-education-license-publisher',
        error?.stack || error?.message || String(error),
        {
          error: error?.message || String(error),
          userId,
          licenseId,
        },
      );
      // Don't throw - fire and forget pattern for certificate create
      // Error is logged but doesn't fail the create operation
    }
  }
}

