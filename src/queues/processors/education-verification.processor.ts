import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { EDUCATION_VERIFICATION_QUEUE } from '../../common/queues/queue.constants';
import { EducationVerificationService } from '../../user_educations/service/education-verification.service';
import { LoggingService } from 'src/logs/logs.service';

/**
 * Processor for education verification queue
 * Handles automatic license granting when education is verified
 */
@Processor(EDUCATION_VERIFICATION_QUEUE)
@Injectable()
export class EducationVerificationProcessor {
  constructor(
    private readonly educationVerificationService: EducationVerificationService,
    private readonly loggingService: LoggingService,
  ) {}

  @Process(EDUCATION_VERIFICATION_QUEUE)
  async handleEducationVerification(job: Job<{ educationId: string }>) {
    const { educationId } = job.data;

    this.loggingService.log(
      `Processing education verification for education ID: ${educationId}`,
      'education-verification',
    );

    try {
      await this.educationVerificationService.processEducationVerificationById(educationId);

      this.loggingService.log(
        `Successfully processed education verification for education ID: ${educationId}`,
        'education-verification',
      );
    } catch (error) {
      this.loggingService.error(
        `Error processing education verification for education ID: ${educationId}`,
        'education-verification',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error; // Re-throw to mark job as failed in Bull
    }
  }
}

