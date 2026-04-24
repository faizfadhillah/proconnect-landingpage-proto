import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE } from '../../common/queues/queue.constants';
import { UsersService } from '../../users/users.service';
import { LoggingService } from 'src/logs/logs.service';

/**
 * Processor for informal certificate user processing queue
 * Handles processing of informal certificates when user registers or updates email/phone
 */
@Processor(INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE)
@Injectable()
export class InformalCertificateUserProcessingProcessor {
  constructor(
    private readonly usersService: UsersService,
    private readonly loggingService: LoggingService,
  ) {}

  @Process(INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE)
  async handleInformalCertificateUserProcessing(
    job: Job<{ userId: string; phone?: string }>,
  ) {
    const { userId, phone } = job.data;

    this.loggingService.log(
      `Processing informal certificates for user ID: ${userId}`,
      'informal-certificate-user-processing',
    );

    try {
      // Call existing public method
      await this.usersService.processInformalCertificatesForUser(userId, phone);

      this.loggingService.log(
        `Successfully processed informal certificates for user ID: ${userId}`,
        'informal-certificate-user-processing',
      );
    } catch (error) {
      this.loggingService.error(
        `Error processing informal certificates for user ID: ${userId}`,
        'informal-certificate-user-processing',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error; // Re-throw to mark job as failed in Bull
    }
  }
}

