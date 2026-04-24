import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstLicenseSkillMappingsService } from "./mst_license_skill_mappings.service";
import { MstLicenseSkillMappingsController } from "./mst_license_skill_mappings.controller";
import { MstLicenseSkillMapping } from "./entities/mst_license_skill_mapping.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { MstSkill } from "../mst_skills/entities/mst_skill.entity";
import { UserCertificate } from "../user_certificates/entities/user_certificates.entity";
import { MstLicenseSkillMappingDao } from "./dao/mst_license_skill_mapping.dao";
import { MstLicensesModule } from "../mst_licenses/mst_licenses.module";
import { MstSkillsModule } from "../mst_skills/mst_skills.module";
import { UserSkillsModule } from "../user_skills/user_skills.module";
import { LogsModule } from "../logs/logs.module";
import { FieldsService } from "../zfields/fields.service";
import { QueuePublishersModule } from "../queues/publishers/queue-publishers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstLicenseSkillMapping,
      MstLicense,
      MstSkill,
      UserCertificate,
    ]),
    QueuePublishersModule,
    MstLicensesModule,
    MstSkillsModule,
    UserSkillsModule,
    LogsModule,
  ],
  controllers: [MstLicenseSkillMappingsController],
  providers: [
    MstLicenseSkillMappingsService,
    MstLicenseSkillMappingDao,
    FieldsService,
  ],
  exports: [MstLicenseSkillMappingsService, MstLicenseSkillMappingDao],
})
export class MstLicenseSkillMappingsModule {}

