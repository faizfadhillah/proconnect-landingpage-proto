import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicantJobStepsService } from "./applicant_job_steps.service";
import { ApplicantJobStepsController } from "./applicant_job_steps.controller";
import { ApplicantJobStep } from "./entities/applicant_job_step.entity";
import { FieldsService } from "src/zfields/fields.service";
import { JobStep } from "src/job_steps/entities/job_step.entity";
import { Applicant } from "src/applicants/entities/applicant.entity";
import { NotificationModule } from "src/firebase/firebase.module";
import { MailjetService } from "src/users/mailjet.service";
import { NotificationService } from "src/users/notification.service";
import { LogsModule } from "src/logs/logs.module";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicantJobStep, JobStep, Applicant, User]),
    NotificationModule,
    LogsModule,
  ],
  controllers: [ApplicantJobStepsController],
  providers: [
    ApplicantJobStepsService,
    FieldsService,
    MailjetService,
    NotificationService,
  ],
  exports: [
    ApplicantJobStepsService,
    FieldsService,
    MailjetService,
    NotificationService,
  ],
})
export class ApplicantJobStepsModule {}
