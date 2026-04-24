import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { CERTIFICATE_VERIFICATION_QUEUE } from '../../common/queues/queue.constants';
import { UserCertificatesService } from '../../user_certificates/user_certificates.service';
import { LoggingService } from 'src/logs/logs.service';

/**
 * Processor for certificate verification queue
 * Handles automatic skill granting when certificate is verified
 */
@Processor(CERTIFICATE_VERIFICATION_QUEUE)
@Injectable()
export class CertificateVerificationProcessor {
  constructor(
    private readonly userCertificatesService: UserCertificatesService,
    private readonly loggingService: LoggingService,
  ) {}

  @Process(CERTIFICATE_VERIFICATION_QUEUE)
  async handleCertificateVerification(job: Job<{ certificateId: string }>) {
    const { certificateId } = job.data;

    this.loggingService.log(
      `Processing certificate verification for certificate ID: ${certificateId}`,
      'certificate-verification',
    );

    try {
      await this.userCertificatesService.processCertificateVerificationById(certificateId);

      this.loggingService.log(
        `Successfully processed certificate verification for certificate ID: ${certificateId}`,
        'certificate-verification',
      );
    } catch (error) {
      this.loggingService.error(
        `Error processing certificate verification for certificate ID: ${certificateId}`,
        'certificate-verification',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error; // Re-throw to mark job as failed in Bull
    }
  }
}

