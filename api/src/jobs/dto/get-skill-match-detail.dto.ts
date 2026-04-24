import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsNotEmpty } from "class-validator";

export class GetSkillMatchDetailDto {
  @ApiProperty({
    description: "Job ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: true,
  })
  @IsNotEmpty({ message: "job_id is required" })
  @IsUUID("4", { message: "job_id must be a valid UUID" })
  job_id: string;

  @ApiProperty({
    description: "Applicant User ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: true,
  })
  @IsNotEmpty({ message: "applicant_user_id is required" })
  @IsUUID("4", { message: "applicant_user_id must be a valid UUID" })
  applicant_user_id: string;
}
