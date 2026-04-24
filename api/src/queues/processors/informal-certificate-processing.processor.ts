import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { INFORMAL_CERTIFICATE_PROCESSING_QUEUE } from '../../common/queues/queue.constants';
import { MstInformalCertificateMappingsService } from '../../mst_informal_certificate_mappings/mst_informal_certificate_mappings.service';
import { LoggingService } from 'src/logs/logs.service';

/**
 * Processor for informal certificate processing queue
 * Handles processing of informal certificate mappings when created by admin
 */
@Processor(INFORMAL_CERTIFICATE_PROCESSING_QUEUE)
@Injectable()
export class InformalCertificateProcessingProcessor {
  constructor(
    private readonly informalCertificateMappingsService: MstInformalCertificateMappingsService,
    private readonly loggingService: LoggingService,
  ) {}

  @Process(INFORMAL_CERTIFICATE_PROCESSING_QUEUE)
  async handleInformalCertificateProcessing(job: Job<{ mappingId: string }>) {
    const { mappingId } = job.data;

    this.loggingService.log(
      `Processing informal certificate mapping ID: ${mappingId}`,
      'informal-certificate-processing',
    );

    try {
      // Call existing public method
      await this.informalCertificateMappingsService.processMapping(mappingId);

      this.loggingService.log(
        `Successfully processed informal certificate mapping ID: ${mappingId}`,
        'informal-certificate-processing',
      );
    } catch (error) {
      this.loggingService.error(
        `Error processing informal certificate mapping ID: ${mappingId}`,
        'informal-certificate-processing',
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error; // Re-throw to mark job as failed in Bull
    }
  }
}

