import { ApiProperty } from "@nestjs/swagger";

export class UploadLicenseSkillMappingResponseDto {
  @ApiProperty({ description: "Number of successfully processed rows" })
  success_count: number;

  @ApiProperty({ description: "Number of failed rows" })
  error_count: number;

  @ApiProperty({ description: "List of errors", type: [String] })
  errors: string[];

  @ApiProperty({ description: "Processing message" })
  message: string;
}

