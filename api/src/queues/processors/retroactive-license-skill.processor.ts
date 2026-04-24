import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { RETROACTIVE_LICENSE_SKILL_QUEUE } from '../../common/queues/queue.constants';
import { MstLicenseSkillMappingsService } from '../../mst_license_skill_mappings/mst_license_skill_mappings.service';
import { LoggingService } from 'src/logs/logs.service';

/**
 * Processor for retroactive license-skill mapping queue
 * Handles retroactive processing when new license-skill mappings are created/updated
 */
@Processor(RETROACTIVE_LICENSE_SKILL_QUEUE)
@Injectable()
export class RetroactiveLicenseSkillProcessor {
  constructor(
    private readonly licenseSkillMappingsService: MstLicenseSkillMappingsService,
    private readonly loggingService: LoggingService,
  ) {}

  @Process(RETROACTIVE_LICENSE_SKILL_QUEUE)
  async handleRetroactiveLicenseSkill(
    job: Job<{ mappingId?: string; userId?: string; skillId?: string }>
  ) {
    const { mappingId, userId, skillId } = job.data;

    // Handle two job data structures:
    // 1. { mappingId: string } - existing flow (mapping created/updated)
    // 2. { userId: string, skillId: string } - new flow (skill created)

    if (mappingId) {
      // Existing flow: process all verified certificates matching this mapping
      this.loggingService.log(
        `Processing retroactive license-skill mapping ID: ${mappingId}`,
        'retroactive-license-skill',
      );

      try {
        const result = await this.licenseSkillMappingsService.processRetroactiveMappings(mappingId);

        this.loggingService.log(
          `Successfully processed retroactive license-skill mapping ID: ${mappingId}. Processed: ${result.processed_count}, Errors: ${result.errors.length}`,
          'retroactive-license-skill',
        );
      } catch (error) {
        this.loggingService.error(
          `Error processing retroactive license-skill mapping ID: ${mappingId}`,
          'retroactive-license-skill',
          error instanceof Error ? error.stack : undefined,
          { error: error instanceof Error ? error.message : String(error) },
        );
        throw error; // Re-throw to mark job as failed in Bull
      }
    } else if (userId && skillId) {
      // New flow: process specific skill for specific user
      this.loggingService.log(
        `Processing retroactive license-skill for user ${userId} and skill ${skillId}`,
        'retroactive-license-skill',
      );

      try {
        await this.licenseSkillMappingsService.processRetroactiveCertificateForSkill(userId, skillId);

        this.loggingService.log(
          `Successfully processed retroactive license-skill for user ${userId} and skill ${skillId}`,
          'retroactive-license-skill',
        );
      } catch (error) {
        this.loggingService.error(
          `Error processing retroactive license-skill for user ${userId} and skill ${skillId}`,
          'retroactive-license-skill',
          error instanceof Error ? error.stack : undefined,
          { error: error instanceof Error ? error.message : String(error) },
        );
        throw error; // Re-throw to mark job as failed in Bull
      }
    } else {
      const errorMessage = 'Invalid job data: must have either mappingId or (userId and skillId)';
      this.loggingService.error(
        errorMessage,
        'retroactive-license-skill',
        undefined,
        { jobData: job.data },
      );
      throw new Error(errorMessage);
    }
  }
}

