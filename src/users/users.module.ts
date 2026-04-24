import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { UsersService } from "./users.service";
import { UsersDao } from "./users.dao";
import { UsersController } from "./users.controller";
import { User } from "./entities/user.entity";
import { UserFieldGuard } from "./entities/user_field_guard.entity";
import { AuthModule } from "../auth/auth.module";
import { HttpModule } from "@nestjs/axios";
import { FieldsService } from "src/zfields/fields.service";
import { UserOtp } from "./entities/user_otp.entity";
import { EncryptedUserData } from "src/encrypted_user_data/entities/encrypted_user_data.entity";
import { LogsModule } from "src/logs/logs.module";
import { UserSkillPassport } from "src/user_skill_passports/entities/user_skill_passport.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { RbacModule } from "src/rbac/rbac.module";
import { MailjetService } from "./mailjet.service";
import { NotificationService } from "./notification.service";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { NotificationModule } from "src/firebase/firebase.module";
import { UserRoleAssignmentsModule } from "src/user_role_assignments/user_role_assignments.module";
import { MstCompaniesModule } from "src/mst_companies/mst_companies.module";
import { ConfigsModule } from "src/config/config.module";
import { MstInformalCertificateMappingsModule } from "src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.module";
import { EncryptedUserDataModule } from "src/encrypted_user_data/encrypted_user_data.module";
import { INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE } from "src/common/queues/queue.constants";
import { NotificationModule as NotificationsModule } from "src/notifications/notifications.module";
import { UserFieldGuardDao } from "./dao/user-field-guard.dao";
import { UserFieldGuardService } from "./user-field-guard.service";
import { SmsOtpService } from "./sms-otp.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserOtp,
      UserFieldGuard,
      EncryptedUserData,
      UserSkillPassport,
      UserEducation,
      MstSchool,
      MstCompany,
    ]),
    BullModule.registerQueue({
      name: INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
    }),
    forwardRef(() => AuthModule),
    HttpModule,
    LogsModule,
    RbacModule,
    NotificationModule,
    forwardRef(() => UserRoleAssignmentsModule),
    MstCompaniesModule,
    ConfigsModule,
    MstInformalCertificateMappingsModule,
    EncryptedUserDataModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersDao,
    UserFieldGuardDao,
    UserFieldGuardService,
    FieldsService,
    MailjetService,
    NotificationService,
    SmsOtpService,
  ],
  exports: [
    UsersService,
    UsersDao,
    UserFieldGuardService,
    FieldsService,
    NotificationService,
    TypeOrmModule,
    MailjetService,
  ],
})
export class UsersModule {}
