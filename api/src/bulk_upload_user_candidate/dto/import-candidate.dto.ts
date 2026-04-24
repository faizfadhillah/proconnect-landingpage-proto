import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ImportCandidateDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "Excel or CSV file containing candidate data",
  })
  file: Express.Multer.File;

  @ApiProperty({
    type: String,
    description: "Optional notes for the upload batch",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkUploadResponseDto {
  @ApiProperty({
    type: String,
    description: "Batch ID for tracking progress",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  batch_id: string;

  @ApiProperty({
    type: Number,
    description: "Total number of rows in the uploaded file",
    example: 100,
  })
  total_rows: number;

  @ApiProperty({
    type: String,
    description: "Status message",
    example: "File uploaded successfully. Processing in background.",
  })
  message: string;
}

export class BatchProgressDto {
  @ApiProperty({
    type: String,
    description: "Batch ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  id: string;

  @ApiProperty({
    type: Number,
    description: "Total rows in batch",
    example: 100,
  })
  total_rows: number;

  @ApiProperty({
    type: Number,
    description: "Number of valid rows processed",
    example: 85,
  })
  valid_rows: number;

  @ApiProperty({
    type: Number,
    description: "Number of invalid rows",
    example: 15,
  })
  invalid_rows: number;

  @ApiProperty({
    type: Number,
    description: "Progress percentage",
    example: 100,
  })
  progress_percentage: number;

  @ApiProperty({
    type: String,
    description: "Upload timestamp",
    example: "2024-01-01T12:00:00.000Z",
  })
  created_at: string;
}

export class RetryEmailDto {
  @ApiProperty({
    type: String,
    description: "Batch ID to retry emails for",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsString()
  batch_id: string;
}

export class DeleteFailedDto {
  @ApiProperty({
    type: String,
    description: "Batch ID to clean up failed registrations",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsString()
  batch_id: string;
}