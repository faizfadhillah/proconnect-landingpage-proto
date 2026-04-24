import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RETROACTIVE_LICENSE_SKILL_QUEUE } from '../../common/queues/queue.constants';
import { LoggingService } from '../../logs/logs.service';

/**
 * Publisher for Retroactive License-Skill Queue
 * Single Responsibility: Handle all queue publishing for retroactive license-skill processing
 */
@Injectable()
export class RetroactiveLicenseSkillQueuePublisher {
  constructor(
    @InjectQueue(RETROACTIVE_LICENSE_SKILL_QUEUE)
    private readonly queue: Queue,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Publish job for retroactive processing when mapping is created/updated
   * @param mappingId - The license-skill mapping ID
   */
  async publishMappingJob(mappingId: string): Promise<void> {
    try {
      await this.queue.add(RETROACTIVE_LICENSE_SKILL_QUEUE, {
        mappingId,
      });
    } catch (error) {
      this.logger.error(
        'Error publishing retroactive license-skill mapping job',
        'retroactive-license-skill-publisher',
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
   * Publish job for retroactive processing when user skill is created
   * @param userId - The user ID
   * @param skillId - The skill ID from the user skill
   */
  async publishSkillJob(userId: string, skillId: string): Promise<void> {
    try {
      await this.queue.add(RETROACTIVE_LICENSE_SKILL_QUEUE, {
        userId,
        skillId,
      });
    } catch (error) {
      this.logger.error(
        'Error publishing retroactive license-skill job',
        'retroactive-license-skill-publisher',
        error?.stack || error?.message || String(error),
        {
          error: error?.message || String(error),
          userId,
          skillId,
        },
      );
      // Don't throw - fire and forget pattern for skill create
      // Error is logged but doesn't fail the create operation
    }
  }
}

