import { Module } from '@nestjs/common';

import { EducationVerificationProcessor } from './processors/education-verification.processor';
import { CertificateVerificationProcessor } from './processors/certificate-verification.processor';
import { InformalCertificateProcessingProcessor } from './processors/informal-certificate-processing.processor';
import { InformalCertificateUserProcessingProcessor } from './processors/informal-certificate-user-processing.processor';
import { RetroactiveEducationLicenseProcessor } from './processors/retroactive-education-license.processor';
import { RetroactiveLicenseSkillProcessor } from './processors/retroactive-license-skill.processor';
import { UserEducationsModule } from '../user_educations/user_educations.module';
import { UserCertificatesModule } from '../user_certificates/user_certificates.module';
import { MstInformalCertificateMappingsModule } from '../mst_informal_certificate_mappings/mst_informal_certificate_mappings.module';
import { UsersModule } from '../users/users.module';
import { MstEducationLicenseMappingsModule } from '../mst_education_license_mappings/mst_education_license_mappings.module';
import { MstLicenseSkillMappingsModule } from '../mst_license_skill_mappings/mst_license_skill_mappings.module';
import { LogsModule } from 'src/logs/logs.module';
/**
 * Queues Module
 * 
 * Centralized module for all async processing queues.
 * Registers processors that consume from queues.
 * 
 * Note: Publishers are in QueuePublishersModule to avoid circular dependencies.
 * Service modules import QueuePublishersModule (not QueuesModule) to get publishers.
 */
@Module({
  imports: [
    // Import modules needed by processors
    UserEducationsModule,
    UserCertificatesModule,
    MstInformalCertificateMappingsModule,
    UsersModule,
    MstEducationLicenseMappingsModule,
    MstLicenseSkillMappingsModule,
    LogsModule,
  ],
  providers: [
    EducationVerificationProcessor,
    CertificateVerificationProcessor,
    InformalCertificateProcessingProcessor,
    InformalCertificateUserProcessingProcessor,
    RetroactiveEducationLicenseProcessor,
    RetroactiveLicenseSkillProcessor,
  ],
  exports: [
    EducationVerificationProcessor,
    CertificateVerificationProcessor,
    InformalCertificateProcessingProcessor,
    InformalCertificateUserProcessingProcessor,
    RetroactiveEducationLicenseProcessor,
    RetroactiveLicenseSkillProcessor,
  ],
})
export class QueuesModule {}

