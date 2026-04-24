import { IsUUID, IsJSON, IsBoolean, IsEnum, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApplicantStatus } from "../entities/applicant.entity";

export class CreateApplicantDto {
  @ApiProperty({
    type: String,
    description: "The id of the job",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  job_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the user",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: Object,
    description: "Additional attributes in JSON format",
    example: { experience: "5 years", skills: ["JavaScript", "TypeScript"] },
  })
  @IsJSON()
  @IsOptional()
  attributes: Record<string, any>;

  @ApiProperty({
    type: String,
    description: "The id of the region",
    example: "17.00",
  })
  region_id: string;

  @ApiProperty({
    type: Boolean,
    description: "Whether the applicant is premium",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_premium: boolean;

  @ApiProperty({
    type: String,
    description: "The status of the application",
    enum: ApplicantStatus,
    example: ApplicantStatus.CONNECT,
  })
  @IsEnum(ApplicantStatus)
  status: ApplicantStatus;
}
