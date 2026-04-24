import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Questionnaire } from "src/questionnaires/entities/questionnaire.entity";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";

export enum JobStepsStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

export enum JobStepType {
  SYS_SHORTLIST = "SYS_SHORTLIST",
  DETAIL_FULFILLMENT = "DETAIL_FULFILLMENT",
  QUESTIONNAIRE = "QUESTIONNAIRE",
  INTERVIEW = "INTERVIEW",
  TEST_PSYCHO = "TEST_PSYCHO",
  SYS_HIRED = "SYS_HIRED",
}

// Interface for interviewer information
export interface InterviewerInfo {
  name: string;
  phone_number: string;
  email: string;
  is_show: boolean;
}

// Interface for interview attributes
export interface InterviewAttributes {
  recipient_to: string;
  recipient_bcc: string;
  pic_name: string;
  pic_phone_number: string;
  pic_email: string;
  interviewer_list: InterviewerInfo[];
  interview_date_time: string;
  interview_timezone: string;
  interview_type: string;
  link_online: string;
  link_offline: string;
  offline_region_id: string;
  offline_is_outside_indo: string;
  offline_other_country: string;
  offline_other_region: string;
  offline_address: string;
  notes_applicant_interview: string;
  notes_interview_results: string;
  attachment_interview_results: string;
  reschedule_request: string;
  reschedule_request_notes_from_candidate: string;
}

// Interface for detail fulfillment item
export interface DetailFulfillmentItem {
  id: string;
  name: string;
  state: string;
  notes: string | null;
}

// Interface for questionnaire attributes (if any)
export interface QuestionnaireAttributes {
  // Add questionnaire-specific attributes here if needed
  // Currently questionnaires are handled as separate entities
}

// Interface for test psycho attributes
export interface TestPsychoTest {
  test_id: string;
  test_type: "FILE" | "LINK" | string;
  test_name: string;
  test_description: string;
  test_file_employer?: string;
  test_file_candidate?: string;
  test_url?: string;
  test_candidate_confirmed?: boolean;
  test_candidate_input_name?: string;
  test_result_notes?: string | null;
  test_result_file?: string | null;
}

// Union type for all possible job step attributes
export type JobStepAttributes =
  | InterviewAttributes
  | DetailFulfillmentItem[]
  | QuestionnaireAttributes
  | TestPsychoTest[]
  | null;

@Entity("job_steps")
export class JobStep extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the job step",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the job this step belongs to",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  job_id: string;

  @ApiProperty({
    description: "The type of the job step",
    example: "etl",
    maxLength: 64,
  })
  @Column({ length: 64 })
  type: string;

  @ApiProperty({
    description: "The name of the job step",
    example: "Extract Data",
    maxLength: 100,
  })
  @Column({ length: 100 })
  step_name: string;

  @ApiProperty({
    description: "The order of the step in the job",
    example: 1,
  })
  @Column({ type: "integer" })
  step_order: number;

  @ApiProperty({
    description: "Description for the job step",
    example: "Initial step to extract data from source",
    nullable: true,
  })
  @Column({ type: "text", nullable: true })
  description: string;

  @ApiProperty({
    description: "The status of the job step",
    enum: JobStepsStatus,
    example: JobStepsStatus.SUBMITTED,
  })
  @Column({
    type: "enum",
    enum: JobStepsStatus,
  })
  status: JobStepsStatus;

  @ApiProperty({
    description: "Notes for the job step",
    example: "Initial step to extract data from source",
    nullable: true,
  })
  @Column({ type: "text", nullable: true })
  notes: string;

  @ApiProperty({
    description: "Attributes for the job step in JSON format",
    example: { source: "database", table: "users" },
    nullable: true,
  })
  @Column({ type: "jsonb", nullable: true })
  attributes: JobStepAttributes;

  @OneToMany(() => Questionnaire, (model) => model.job_step)
  @ApiProperty({ type: () => Questionnaire, isArray: true })
  questionnaires: Questionnaire[];

  @OneToMany(() => ApplicantJobStep, (model) => model.jobStep)
  @ApiProperty({ type: () => ApplicantJobStep, isArray: true })
  applicantJobSteps: ApplicantJobStep[];
}
