import { Module, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { ScheduleModule } from "@nestjs/schedule";
import { ClsModule, ClsMiddleware } from "nestjs-cls";
import { LoggerModule } from "nestjs-pino";
import { RequestIdMiddleware } from "./request-id.middleware";
import { RequestContextModule } from "../common/request-context/request-context.module";
import { ShutdownService } from "./shutdown.service";
import { pinoConfig } from "../logs/pino.config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "../auth/auth.module";

import { UserTrackingSubscriber } from "../auth/user-tracking.subscriber";
import { UsersModule } from "../users/users.module";
import { UsersService } from "../users/users.service";
import { ConfigsModule } from "../config/config.module";
import { ConfigsService } from "../config/config.service";
import { UserFilesModule } from "../user_files/user_files.module";
import { EncryptedUserDataModule } from "../encrypted_user_data/encrypted_user_data.module";
import { MstRightToWorksModule } from "..//mst_right_to_works/mst_right_to_works.module";
import { UserRightToWorkModule } from "../user_right_to_work/user-right-to-work.module";
import { MstRegionsModule } from "../mst_regions/mst_regions.module";
import { MstDepartmentsModule } from "../mst_departments/mst_departments.module";
import { MstCompaniesModule } from "../mst_companies/mst_companies.module";
import { CompanyDepartmentMapModule } from "../company_department_map/company_department_map.module";
import { CompanyFilesModule } from "../company_files/company_files.module";
import { ApplicantsModule } from "../applicants/applicants.module";
import { ApplicantStepsModule } from "../applicant-steps/applicant-steps.module";
import { ApplicantLegalFilesModule } from "../applicant-legal-files/applicant-legal-files.module";
import { JobsModule } from "../jobs/jobs.module";
import { MediaModule } from "../media/media.module";
import { InvoicesModule } from "src/invoices/invoices.module";
import { InvoicesItemsModule } from "src/invoices_items/invoices_items.module";
import { PostsModule } from "src/posts/posts.module";
import { EventsModule } from "src/events/events.module";
import { MstSubscriptionModule } from "src/mst_subscription/mst_subscription.module";
import { UserSubscriptionModule } from "src/user_subscription/user_subscription.module";
import { EventPaketsModule } from "src/event_pakets/event_pakets.module";
import { MstTagsModule } from "src/mst_tags/mst_tags.module";
import { FollowUserToUserModule } from "src/follow_user_to_user/follow_user_to_user.module";
import { FollowUserToCompaniesModule } from "src/follow_user_to_companies/follow_user_to_companies.module";
import { GroupsModule } from "src/groups/groups.module";
import { GroupMembersModule } from "src/group-members/group-members.module";
import { UserSkillPassportsModule } from "src/user_skill_passports/user_skill_passports.module";
import { UserCareerHistoryModule } from "src/user_career_history/user_career_history.module";
import { MstSkillsModule } from "src/mst_skills/mst_skills.module";
import { UserSkillsModule } from "src/user_skills/user_skills.module";
import { MstProfessionsModule } from "src/mst_professions/mst_professions.module";
import { UserProfessionsModule } from "src/user_professions/user_professions.module";
import { MstSchoolsModule } from "src/mst_schools/mst_schools.module";
import { MstSchoolMajorsModule } from "src/mst_school_majors/mst_school_majors.module";
import { UserEducationsModule } from "src/user_educations/user_educations.module";
import { FirebaseModule } from "nestjs-firebase";
import { MstLanguagesModule } from "src/mst_languages/mst_languages.module";
import { MstLicensesModule } from "src/mst_licenses/mst_licenses.module";
import { MstMajorsModule } from "src/mst_majors/mst_majors.module";
import { MstEducationLicenseMappingsModule } from "src/mst_education_license_mappings/mst_education_license_mappings.module";
import { MstEducationProfessionMappingsModule } from "src/mst_education_profession_mappings/mst_education_profession_mappings.module";
import { MstInformalCertificateMappingsModule } from "src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.module";
import { MstLicenseSkillMappingsModule } from "src/mst_license_skill_mappings/mst_license_skill_mappings.module";
import { UserLanguagesModule } from "src/user_languages/user_languages.module";
import { IsUnique } from "./validators/is-unique";
import { IsForeignKey } from "./validators/is-foreign-key";
import { FieldsModule } from "src/zfields/fields.module";
import { MstInterestsModule } from "src/mst_interests/mst_interests.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthRbacGuard } from "src/auth/auth-rbac.guard";
import { UserSalaryCountryModule } from "src/user_salary_country/user_salary_country.module";
import { MstSalaryCountryModule } from "src/mst_salary_country/mst_salary_country.module";
import { UserCertificatesModule } from "src/user_certificates/user_certificates.module";
import { UserInterestsModule } from "src/user_interests/user_interests.module";
import { MstAspCompetenciesModule } from "src/mst_asp_competencies/mst_asp_competencies.module";
import { FeedbacksModule } from "src/feedbacks/feedbacks.module";
import { MstIndustriesModule } from "src/mst_industries/mst_industries.module";
import { NotificationModule } from "src/firebase/firebase.module";
import { LogsModule } from "src/logs/logs.module";
import { MstCountryModule } from "src/mst_country/mst_country.module";
import { JobStepsModule } from "src/job_steps/job_steps.module";
import { ApplicantJobStepsModule } from "src/applicant_job_steps/applicant_job_steps.module";
import { QuestionnairesModule } from "src/questionnaires/questionnaires.module";
import { QuestionnaireAnswersModule } from "src/questionnaire_answers/questionnaire_answers.module";
import { BulkUploadUserCandidateModule } from "src/bulk_upload_user_candidate/bulk-upload.module";
import { UserRoleAssignmentsModule } from "src/user_role_assignments/user_role_assignments.module";
import { RbacModule } from "src/rbac/rbac.module";
import { DataMigrationModule } from "src/datamigration/datamigration.module";
import { BackendExceptionFilter } from "src/global_filter/backend-exception.filter";
import { RedisModule } from "src/common/redis/redis.module";
import { RedisService } from "src/common/redis/redis.service";
import { LoggingInterceptor } from "src/global_filter/logging.interceptor";
import { QueuesModule } from "src/queues/queues.module";
import { LoggingService } from "src/logs/logs.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(pinoConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DATABASE_HOST"),
        port: configService.get("DATABASE_PORT"),
        username: configService.get("DATABASE_USERNAME"),
        password: configService.get("DATABASE_PASSWORD"),
        database: configService.get("DATABASE_NAME"),
        entities: ["dist/**/*.entity{.ts,.js}"],
        migrations: ["dist/migrations/*{.ts,.js}"],
        synchronize: false,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD", ""),
          db: configService.get("REDIS_DB", 0),
        },
      }),
    }),
    // Note: Queues are registered in their respective feature modules
    // ShutdownService gets them dynamically from app context

    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: false, // We'll mount manually to control order
      },
    }),

    RequestContextModule,

    FirebaseModule.forRoot({
      googleApplicationCredential:
        __dirname + "/../../../config/firebase-admin.json",
    }),

    // Need to SORT ASC for swagger JSON
    ApplicantLegalFilesModule,
    ApplicantsModule,
    ApplicantStepsModule,
    AuthModule,
    CompanyDepartmentMapModule,
    CompanyFilesModule,
    RbacModule,
    ConfigsModule,
    EncryptedUserDataModule,
    EventPaketsModule,
    EventsModule,
    FieldsModule,
    NotificationModule,
    FollowUserToCompaniesModule,
    FollowUserToUserModule,
    GroupMembersModule,
    GroupsModule,
    InvoicesItemsModule,
    MstInterestsModule,
    InvoicesModule,
    JobsModule,
    LogsModule,
    MediaModule,
    DataMigrationModule,
    MstIndustriesModule,
    MstCompaniesModule,
    MstDepartmentsModule,
    MstSchoolsModule,
    MstSchoolMajorsModule,
    MstLanguagesModule,
    MstLicensesModule,
    MstLicenseSkillMappingsModule,
    MstMajorsModule,
    MstEducationLicenseMappingsModule,
    MstEducationProfessionMappingsModule,
    MstInformalCertificateMappingsModule,
    MstProfessionsModule,
    MstRegionsModule,
    MstRightToWorksModule,
    MstSkillsModule,
    MstSubscriptionModule,
    MstTagsModule,
    MstAspCompetenciesModule,
    MstInterestsModule,
    MstSalaryCountryModule,
    MstCountryModule,
    PostsModule,
    FeedbacksModule,
    UserCareerHistoryModule,
    UserSkillPassportsModule,
    UserCertificatesModule,
    UserEducationsModule,
    UserFilesModule,
    UserLanguagesModule,
    UserProfessionsModule,
    UserRightToWorkModule,
    UserRoleAssignmentsModule,
    UserSkillsModule,
    UserInterestsModule,
    UserSalaryCountryModule,
    UsersModule,
    UserSubscriptionModule,
    JobStepsModule,
    ApplicantJobStepsModule,
    QuestionnairesModule,
    QuestionnaireAnswersModule,
    BulkUploadUserCandidateModule,
    RedisModule,
    QueuesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserTrackingSubscriber,
    IsUnique,
    IsForeignKey,
    RequestIdMiddleware,
    BackendExceptionFilter,
    LoggingInterceptor,
    ShutdownService,
    {
      provide: APP_GUARD,
      useClass: AuthRbacGuard,
    },
  ],
})
export class AppModule {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly configsService: ConfigsService,
    private readonly loggingService: LoggingService,
  ) {}

  async onModuleInit() {
    // Check Redis connection
    try {
      const pingResult = await this.redisService.ping();
      const isConnected = this.redisService.isConnected();

      if (isConnected && pingResult === "PONG") {
        const redisHost = this.configService.get("REDIS_HOST") || "localhost";
        const redisPort = this.configService.get("REDIS_PORT") || "6379";
        this.loggingService.log(
          `Redis connected successfully (host: ${redisHost}:${redisPort})`,
          "redis-connection",
        );
      } else {
        this.loggingService.warn(
          "Redis connection status unclear",
          "redis-connection",
        );
      }
    } catch (error) {
      this.loggingService.error(
        `Failed to connect to Redis: ${error instanceof Error ? error.message : String(error)}`,
        "redis-connection",
        error instanceof Error ? error.stack : undefined,
      );
    }

    // Optional seeding based on environment variable
    const shouldSeed =
      this.configService.get<string>("SEED_SUPER_ADMIN") === "true";
    if (shouldSeed) {
      await this.usersService.seedSuperAdmin(); // Call the seeding logic here
      await this.usersService.seedAdminViewer(); // Seed admin viewer
    }

    // Seed all configs
    await this.configsService.seedAllConfigs();
  }

  configure(consumer: MiddlewareConsumer) {
    // Mount ClsMiddleware FIRST to initialize CLS context
    // Then mount RequestIdMiddleware which depends on CLS context
    consumer
      .apply(ClsMiddleware)
      .forRoutes("*")
      .apply(RequestIdMiddleware)
      .forRoutes("*");
  }
}
