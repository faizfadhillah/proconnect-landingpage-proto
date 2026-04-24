// src\user_Certificates\user_Certificates.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { UserCertificatesService } from "./user_certificates.service";
import { UserCertificatesController } from "./user_certificates.controller";
import { UserCertificate } from "./entities/user_certificates.entity";
import { UserEducation } from "../user_educations/entities/user_education.entity";
import { MstLicensesModule } from "src/mst_licenses/mst_licenses.module";
import { MstLicenseSkillMappingsModule } from "src/mst_license_skill_mappings/mst_license_skill_mappings.module";
import { UserSkillsModule } from "src/user_skills/user_skills.module";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { CERTIFICATE_VERIFICATION_QUEUE } from "src/common/queues/queue.constants";
import { QueuePublishersModule } from "src/queues/publishers/queue-publishers.module";
import { UserCertificateDao } from "./user_certificate.dao";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCertificate, UserEducation]),
    BullModule.registerQueue({
      name: CERTIFICATE_VERIFICATION_QUEUE,
    }),
    QueuePublishersModule,
    MstLicensesModule,
    MstLicenseSkillMappingsModule,
    UserSkillsModule,
    LogsModule,
  ],
  controllers: [UserCertificatesController],
  providers: [
    UserCertificatesService,
    UserCertificateDao,
    FieldsService,
  ],
  exports: [UserCertificatesService, UserCertificateDao, FieldsService],
})
export class UserCertificatesModule {}
