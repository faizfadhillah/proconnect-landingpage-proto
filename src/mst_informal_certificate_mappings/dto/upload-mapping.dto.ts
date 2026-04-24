import { ApiProperty } from "@nestjs/swagger";

export class UploadMappingResponseDto {
  @ApiProperty({
    description: "Number of successfully processed rows",
    example: 10,
  })
  success_count: number;

  @ApiProperty({
    description: "Number of failed rows",
    example: 2,
  })
  error_count: number;

  @ApiProperty({
    description: "List of errors",
    type: [String],
    example: ["Row 3: License ID not found", "Row 5: Either email or phone must be provided"],
  })
  errors: string[];

  @ApiProperty({
    description: "Processing message",
    example: "Processing complete. Success: 10, Errors: 2",
  })
  message: string;
}

