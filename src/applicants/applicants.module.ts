// src/applicants\applicants.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicantsService } from "./applicants.service";
import { ApplicantsController } from "./applicants.controller";
import { Applicant } from "./entities/applicant.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { NotificationModule } from "src/firebase/firebase.module";

import { UsersModule } from "src/users/users.module";
import { Job } from "src/jobs/entities/job.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { JobStep } from "src/job_steps/entities/job_step.entity";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";
import { MailjetService } from "src/users/mailjet.service";
import { NotificationService } from "src/users/notification.service";
import { ApplicantJobStepsService } from "src/applicant_job_steps/applicant_job_steps.service";
import { JobsModule } from "src/jobs/jobs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Applicant,
      Job,
      MstCompany,
      JobStep,
      ApplicantJobStep,
    ]),
    LogsModule,
    NotificationModule,
    UsersModule,
    JobsModule,
  ],
  controllers: [ApplicantsController],
  providers: [
    ApplicantsService,
    MailjetService,
    FieldsService,
    NotificationService,
    ApplicantJobStepsService,
  ],
  exports: [
    ApplicantsService,
    MailjetService,
    FieldsService,
    NotificationService,
  ],
})
export class ApplicantsModule {}
