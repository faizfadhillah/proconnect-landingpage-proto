import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RetroactiveEducationLicenseQueuePublisher } from './retroactive-education-license-queue.publisher';
import { RetroactiveLicenseSkillQueuePublisher } from './retroactive-license-skill-queue.publisher';
import { RETROACTIVE_EDUCATION_LICENSE_QUEUE, RETROACTIVE_LICENSE_SKILL_QUEUE } from '../../common/queues/queue.constants';
import { LogsModule } from '../../logs/logs.module';

/**
 * Queue Publishers Module
 * 
 * Separate module for queue publishers to avoid circular dependencies.
 * QueuesModule imports service modules (for processors), but service modules
 * need publishers, so we separate publishers into this module.
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: RETROACTIVE_EDUCATION_LICENSE_QUEUE,
    }),
    BullModule.registerQueue({
      name: RETROACTIVE_LICENSE_SKILL_QUEUE,
    }),
    LogsModule,
  ],
  providers: [
    RetroactiveEducationLicenseQueuePublisher,
    RetroactiveLicenseSkillQueuePublisher,
  ],
  exports: [
    RetroactiveEducationLicenseQueuePublisher,
    RetroactiveLicenseSkillQueuePublisher,
  ],
})
export class QueuePublishersModule {}

