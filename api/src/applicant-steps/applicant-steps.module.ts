// src\applicant-steps\applicant-steps.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicantStepsService } from "./applicant-steps.service";
import { ApplicantStepsController } from "./applicant-steps.controller";
import { ApplicantStep } from "./entities/applicant-step.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([ApplicantStep]), LogsModule],
  controllers: [ApplicantStepsController],
  providers: [ApplicantStepsService, FieldsService],
  exports: [ApplicantStepsService, FieldsService],
})
export class ApplicantStepsModule {}
