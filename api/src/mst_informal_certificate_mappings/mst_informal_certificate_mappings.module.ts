import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { MstInformalCertificateMappingsService } from "./mst_informal_certificate_mappings.service";
import { MstInformalCertificateMappingsController } from "./mst_informal_certificate_mappings.controller";
import { MstInformalCertificateMapping } from "./entities/mst_informal_certificate_mapping.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { User } from "../users/entities/user.entity";
import { UserCertificate } from "../user_certificates/entities/user_certificates.entity";
import { MstInformalCertificateMappingDao } from "./dao/mst_informal_certificate_mapping.dao";
import { MstLicensesModule } from "../mst_licenses/mst_licenses.module";
import { UserCertificatesModule } from "../user_certificates/user_certificates.module";
import { UsersModule } from "../users/users.module";
import { EncryptedUserDataModule } from "../encrypted_user_data/encrypted_user_data.module";
import { LogsModule } from "../logs/logs.module";
import { FieldsService } from "../zfields/fields.service";
import { INFORMAL_CERTIFICATE_PROCESSING_QUEUE } from "../common/queues/queue.constants";
import { MstLicenseSkillMappingsModule } from "../mst_license_skill_mappings/mst_license_skill_mappings.module";
import { UserSkillsModule } from "../user_skills/user_skills.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstInformalCertificateMapping,
      MstLicense,
      User,
      UserCertificate,
    ]),
    BullModule.registerQueue({
      name: INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
    }),
    MstLicensesModule,
    UserCertificatesModule,
    forwardRef(() => UsersModule),
    EncryptedUserDataModule,
    LogsModule,
    MstLicenseSkillMappingsModule,
    UserSkillsModule,
  ],
  controllers: [MstInformalCertificateMappingsController],
  providers: [
    MstInformalCertificateMappingsService,
    MstInformalCertificateMappingDao,
    FieldsService,
  ],
  exports: [MstInformalCertificateMappingsService, MstInformalCertificateMappingDao],
})
export class MstInformalCertificateMappingsModule {}

