import { IsUUID, IsEnum, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { JobsStepsStatus } from "../entities/applicant_job_step.entity";

export class CreateApplicantJobStepDto {
  @ApiProperty({
    type: String,
    description: "The id of the applicant",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  applicant_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the job step",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  job_step_id: string;

  @ApiProperty({
    type: String,
    description: "The status of the applicant job step",
    enum: JobsStepsStatus,
    example: JobsStepsStatus.SUBMITTED,
  })
  @IsEnum(JobsStepsStatus)
  status: JobsStepsStatus;

  @ApiProperty({
    type: String,
    description: "Notes for the applicant job step",
    example: "Applicant is in progress",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: Object,
    description: "Attributes for the applicant job step",
    example: { key: "value" },
    required: false,
  })
  @IsOptional()
  attributes?: any;

  /*
  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user who created the applicant job step',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'The ID of the user who updated the applicant job step',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
  */
}
