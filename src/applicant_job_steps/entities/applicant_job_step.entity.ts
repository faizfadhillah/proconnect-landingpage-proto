import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Applicant } from "src/applicants/entities/applicant.entity";
import { JobStep } from "src/job_steps/entities/job_step.entity";
import { QuestionnaireAnswer } from "../../questionnaire_answers/entities/questionnaire_answer.entity";
import { Job } from "src/jobs/entities/job.entity";
import { User } from "src/users/entities/user.entity";

export enum JobsStepsStatus {
  PENDING = "PENDING",
  CURRENT = "CURRENT",
  REVISED = "REVISED",
  ACCEPTED = "ACCEPTED",
  SCHEDULED = "SCHEDULED",
  RESCHEDULED = "RESCHEDULED",
  FAILED = "FAILED",
  SUBMITTED = "SUBMITTED",
  SKIPPED = "SKIPPED",
}

@Entity("applicant_job_steps")
export class ApplicantJobStep extends BaseEntity {
  @ApiProperty({
    description: "The ID of the applicant",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  applicant_id: string;

  @ApiProperty({
    description: "The ID of the job step",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  job_step_id: string;

  @ApiProperty({
    description: "The ID of the job",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  @Column("uuid")
  job_id: string;

  @ApiProperty({
    description: "The ID of the user",
    example: "123e4567-e89b-12d3-a456-426614174004",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The status of the applicant job step",
    enum: JobsStepsStatus,
    example: JobsStepsStatus.SUBMITTED,
  })
  @Column({
    type: "enum",
    enum: JobsStepsStatus,
  })
  status: JobsStepsStatus;

  @ApiProperty({
    description: "Notes for the applicant job step",
    example: "Applicant is in progress",
  })
  @Column({ type: "text", nullable: true })
  notes?: string;

  @ApiProperty({
    description: "Attributes for the applicant job step",
    example: { key: "value" },
  })
  @Column({ type: "jsonb", nullable: true })
  attributes?: any;

  @ManyToOne(() => Applicant, (model) => model.id)
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => JobStep, (model) => model.id)
  @JoinColumn({ name: "job_step_id" })
  jobStep: JobStep;

  @ManyToOne(() => Job, (model) => model.id)
  @JoinColumn({ name: "job_id" })
  job: Job;

  @OneToMany(() => QuestionnaireAnswer, (model) => model.applicantJobStep)
  @ApiProperty({ type: () => QuestionnaireAnswer, isArray: true })
  questionnaireAnswers: QuestionnaireAnswer[];
}
