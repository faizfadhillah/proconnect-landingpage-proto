import {
  IsUUID,
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { StepStatus } from "../entities/applicant-step.entity";

export class CreateApplicantStepDto {
  @ApiProperty({
    type: String,
    description: "The ID of the applicant",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  applicantId: string;

  @ApiProperty({
    type: String,
    description: "The name of the step",
    example: "Document Verification",
  })
  @IsString()
  @Length(1, 100)
  step_name: string;

  @ApiProperty({
    type: Number,
    description: "The order of the step",
    example: 1,
  })
  @IsInt()
  step_order: number;

  @ApiProperty({
    enum: StepStatus,
    description: "The status of the step",
    example: StepStatus.PENDING,
  })
  @IsEnum(StepStatus)
  status: StepStatus;

  @ApiProperty({
    type: String,
    description: "Additional notes for the step",
    example: "Waiting for document submission",
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
