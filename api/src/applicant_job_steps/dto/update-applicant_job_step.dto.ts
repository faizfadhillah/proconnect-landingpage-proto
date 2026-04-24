import { PartialType } from "@nestjs/mapped-types";
import { CreateApplicantJobStepDto } from "./create-applicant_job_step.dto";
import { IsEnum, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { JobsStepsStatus } from "../entities/applicant_job_step.entity";

export class UpdateApplicantJobStepDto extends PartialType(
  CreateApplicantJobStepDto,
) {
  @ApiProperty({
    type: String,
    description: "The status of the applicant job step",
    enum: JobsStepsStatus,
    example: JobsStepsStatus.SUBMITTED,
    required: false,
  })
  @IsOptional()
  @IsEnum(JobsStepsStatus)
  status?: JobsStepsStatus;

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
    description: 'The ID of the user who updated the applicant job step',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  updated_by?: string;
  */
}
