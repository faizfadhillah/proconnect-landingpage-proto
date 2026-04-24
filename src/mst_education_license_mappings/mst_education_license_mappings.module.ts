import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstEducationLicenseMappingsService } from "./mst_education_license_mappings.service";
import { MstEducationLicenseMappingsController } from "./mst_education_license_mappings.controller";
import { MstEducationLicenseMapping } from "./entities/mst_education_license_mapping.entity";
import { MstSchool } from "../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../mst_majors/entities/mst_major.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { User } from "../users/entities/user.entity";
import { UserEducation } from "../user_educations/entities/user_education.entity";
import { MstEducationLicenseMappingDao } from "./dao/mst_education_license_mapping.dao";
import { UserRoleAssignmentsModule } from "../user_role_assignments/user_role_assignments.module";
import { MstSchoolsModule } from "../mst_schools/mst_schools.module";
import { MstMajorsModule } from "../mst_majors/mst_majors.module";
import { MstLicensesModule } from "../mst_licenses/mst_licenses.module";
import { UsersModule } from "../users/users.module";
import { ConfigsModule } from "../config/config.module";
import { LogsModule } from "../logs/logs.module";
import { UserCertificatesModule } from "../user_certificates/user_certificates.module";
import { FieldsService } from "../zfields/fields.service";
import { QueuePublishersModule } from "../queues/publishers/queue-publishers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstEducationLicenseMapping,
      MstSchool,
      MstMajor,
      MstLicense,
      User,
      UserEducation,
    ]),
    QueuePublishersModule,
    forwardRef(() => UserRoleAssignmentsModule),
    MstSchoolsModule,
    MstMajorsModule,
    MstLicensesModule,
    UsersModule,
    ConfigsModule,
    LogsModule,
    UserCertificatesModule,
  ],
  controllers: [MstEducationLicenseMappingsController],
  providers: [
    MstEducationLicenseMappingsService,
    MstEducationLicenseMappingDao,
    FieldsService,
  ],
  exports: [MstEducationLicenseMappingsService, MstEducationLicenseMappingDao],
})
export class MstEducationLicenseMappingsModule {}

