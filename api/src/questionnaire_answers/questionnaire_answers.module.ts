import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuestionnaireAnswersService } from "./questionnaire_answers.service";
import { QuestionnaireAnswersController } from "./questionnaire_answers.controller";
import { QuestionnaireAnswer } from "./entities/questionnaire_answer.entity";
import { FieldsModule } from "src/zfields/fields.module";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";

@Module({
  imports: [TypeOrmModule.forFeature([QuestionnaireAnswer, ApplicantJobStep]), FieldsModule],
  controllers: [QuestionnaireAnswersController],
  providers: [QuestionnaireAnswersService],
  exports: [QuestionnaireAnswersService],
})
export class QuestionnaireAnswersModule {}
