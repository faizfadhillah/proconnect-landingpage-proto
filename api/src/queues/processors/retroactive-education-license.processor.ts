import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { RETROACTIVE_EDUCATION_LICENSE_QUEUE } from '../../common/queues/queue.constants';
import { MstEducationLicenseMappingsService } from '../../mst_education_license_mappings/mst_education_license_mappings.service';
import { LoggingService } from 'src/logs/logs.service';

/**
 * Processor for retroactive education-license mapping queue
 * Handles retroactive processing when new education-license mappings are created/updated
 */
@Processor(RETROACTIVE_EDUCATION_LICENSE_QUEUE)
@Injectable()
export class RetroactiveEducationLicenseProcessor {
  constructor(
    private readonly educationLicenseMappingsService: MstEducationLicenseMappingsService,
    private readonly loggingService: LoggingService,
  ) {}

  @Process(RETROACTIVE_EDUCATION_LICENSE_QUEUE)
  async handleRetroactiveEducationLicense(
    job: Job<{ mappingId?: string; userId?: string; licenseId?: string }>
  ) {
    const { mappingId, userId, licenseId } = job.data;

    // Handle two job data structures:
    // 1. { mappingId: string } - existing flow (mapping created/updated)
    // 2. { userId: string, licenseId: string } - new flow (certificate created)

    if (mappingId) {
      // Existing flow: process all verified educations matching this mapping
      this.loggingService.log(
        `Processing retroactive education-license mapping ID: ${mappingId}`,
        'retroactive-education-license',
      );

      try {
        const result = await this.educationLicenseMappingsService.processRetroactiveMappings(mappingId);

        this.loggingService.log(
          `Successfully processed retroactive education-license mapping ID: ${mappingId}. Processed: ${result.processed_count}, Errors: ${result.errors.length}`,
          'retroactive-education-license',
        );
      } catch (error) {
        this.loggingService.error(
          `Error processing retroactive education-license mapping ID: ${mappingId}`,
          'retroactive-education-license',
          error instanceof Error ? error.stack : undefined,
          { error: error instanceof Error ? error.message : String(error) },
        );
        throw error; // Re-throw to mark job as failed in Bull
      }
    } else if (userId && licenseId) {
      // New flow: process specific license for specific user
      this.loggingService.log(
        `Processing retroactive education-license for user ${userId} and license ${licenseId}`,
        'retroactive-education-license',
      );

      try {
        await this.educationLicenseMappingsService.processRetroactiveEducationForLicense(userId, licenseId);

        this.loggingService.log(
          `Successfully processed retroactive education-license for user ${userId} and license ${licenseId}`,
          'retroactive-education-license',
        );
      } catch (error) {
        this.loggingService.error(
          `Error processing retroactive education-license for user ${userId} and license ${licenseId}`,
          'retroactive-education-license',
          error instanceof Error ? error.stack : undefined,
          { error: error instanceof Error ? error.message : String(error) },
        );
        throw error; // Re-throw to mark job as failed in Bull
      }
    } else {
      const errorMessage = 'Invalid job data: must have either mappingId or (userId and licenseId)';
      this.loggingService.error(
        errorMessage,
        'retroactive-education-license',
        undefined,
        { jobData: job.data },
      );
      throw new Error(errorMessage);
    }
  }
}

