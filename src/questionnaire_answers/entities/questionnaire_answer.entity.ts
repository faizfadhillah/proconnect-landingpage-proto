import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";

@Entity("questionnaire_answers")
export class QuestionnaireAnswer extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the questionnaire answer",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the questionnaire",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  questionnaire_id: string;

  @ApiProperty({
    description: "The ID of the job step",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  job_step_id: string;

  @ApiProperty({
    description: "The ID of the job",
    example: "123e4567-e89b-12d3-a456-426614174004",
  })
  @Column("uuid")
  job_id: string;

  @ApiProperty({
    description: "The ID of the applicant step",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  @Column("uuid")
  applicant_job_step_id: string;

  @ApiProperty({
    description: "The ID of the applicant",
    example: "123e4567-e89b-12d3-a456-426614174005",
  })
  @Column("uuid")
  applicant_id: string;

  @ApiProperty({
    description: "The question number",
    example: 1,
  })
  @Column({ type: "integer" })
  no: number;

  @ApiProperty({
    description: "The type of the question",
    example: "single-choice",
    maxLength: 64,
  })
  @Column({ length: 64 })
  type: string;

  @ApiProperty({
    description: "The question text",
    example: "What is your favorite color?",
  })
  @Column({ type: "text" })
  question: string;

  @ApiProperty({
    description: "The options for the question (JSON)",
    example: '{"options": ["Red", "Blue", "Green"]}',
  })
  @Column({ type: "jsonb" })
  options: JSON;

  @ApiProperty({
    description: "Whether the question is required",
    example: true,
  })
  @Column({ type: "boolean", default: false })
  is_required: boolean;

  @ApiProperty({
    description: "The answer value (JSON)",
    example: '{"answer": "Blue"}',
  })
  @Column({ type: "jsonb" })
  value: JSON;

  @ManyToOne(() => ApplicantJobStep, (model) => model.id)
  @JoinColumn({ name: "applicant_job_step_id" })
  applicantJobStep: ApplicantJobStep;
}
