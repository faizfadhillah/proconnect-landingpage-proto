import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { JobStep } from "src/job_steps/entities/job_step.entity";

@Entity("questionnaires")
export class Questionnaire extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the questionnaire",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the job step this questionnaire belongs to",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  job_step_id: string;

  @ApiProperty({
    description: "The number of the question in the questionnaire",
    example: 1,
  })
  @Column("integer")
  no: number;

  @ApiProperty({
    description: "The type of the question",
    example:
      "TEXT-SHORT , TEXT-LONG, RADIO-BUTTON, CHECKBOX, DROP-DOWN, ATTACHMENT",
    maxLength: 64,
  })
  @Column({ length: 64 })
  type: string;

  @ApiProperty({
    description: "The text of the question",
    example: "What is your favorite color?",
  })
  @Column("text")
  question: string;

  @ApiProperty({
    description: "The options for the question in JSON format",
    example: { options: ["Red", "Blue", "Green"] },
  })
  @Column({ type: "jsonb" })
  options: object;

  @ApiProperty({
    description: "Whether the question is required",
    example: false,
    default: false,
  })
  @Column({ type: "boolean", default: false })
  is_required: boolean;

  @ManyToOne(() => JobStep, (model) => model.id)
  @JoinColumn({ name: "job_step_id" })
  job_step: JobStep;
}
