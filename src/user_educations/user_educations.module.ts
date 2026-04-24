// src\user_educations\user_educations.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { UserEducationsService } from "./service/user_educations.service";
import { UserEducationsController } from "./controller/user_educations.controller";
import { PendingStudentVerificationsService } from "./service/pending_student_verifications.service";
import { PendingStudentVerificationsController } from "./controller/pending_student_verifications.controller";
import { EducationVerificationService } from "./service/education-verification.service";
import { EducationHelperService } from "./service/education-helper.service";
import { StudentsService } from "./service/students.service";
import { PendingStudentAutoInsertService } from "./service/pending-student-auto-insert.service";
import { EducationCertificateSyncService } from "./service/education-certificate-sync.service";
import { UserEducation } from "./entities/user_education.entity";
import { PendingStudentVerification } from "./entities/pending_student_verification.entity";
import { PendingStudentVerificationsDao } from "./dao/pending_student_verifications.dao";
import { UserEducationsDao } from "./dao/user_educations.dao";
import { StudentsDao } from "./dao/students.dao";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { User } from "src/users/entities/user.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";
import { MstSchoolMajor } from "src/mst_school_majors/entities/mst_school_major.entity";
import { MstEducationLicenseMappingsModule } from "../mst_education_license_mappings/mst_education_license_mappings.module";
import { MstLicenseSkillMappingsModule } from "../mst_license_skill_mappings/mst_license_skill_mappings.module";
import { UserCertificatesModule } from "../user_certificates/user_certificates.module";
import { UserSkillsModule } from "../user_skills/user_skills.module";
import { EncryptedUserDataModule } from "../encrypted_user_data/encrypted_user_data.module";
import { ConfigsModule } from "../config/config.module";
import { EDUCATION_VERIFICATION_QUEUE } from "src/common/queues/queue.constants";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEducation, PendingStudentVerification, User, MstSchool, MstMajor, MstSchoolMajor]),
    BullModule.registerQueue({
      name: EDUCATION_VERIFICATION_QUEUE,
    }),
    MstEducationLicenseMappingsModule,
    MstLicenseSkillMappingsModule,
    UserCertificatesModule,
    UserSkillsModule,
    EncryptedUserDataModule,
    ConfigsModule,
    LogsModule,
  ],
  controllers: [UserEducationsController, PendingStudentVerificationsController],
  providers: [
    UserEducationsService,
    EducationVerificationService,
    EducationHelperService,
    StudentsService,
    PendingStudentVerificationsService,
    PendingStudentAutoInsertService,
    EducationCertificateSyncService,
    PendingStudentVerificationsDao,
    UserEducationsDao,
    StudentsDao,
    FieldsService,
  ],
  exports: [UserEducationsService, EducationVerificationService, FieldsService, PendingStudentVerificationsService],
})
export class UserEducationsModule {}
