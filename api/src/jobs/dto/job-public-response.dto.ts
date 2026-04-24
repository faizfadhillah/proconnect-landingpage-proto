import { ApiProperty } from "@nestjs/swagger";
import { JobStatus } from "../entities/job.entity";

export class JobPublicResponseDto {
  @ApiProperty({
    description: "Job ID",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  id: string;

  @ApiProperty({
    description: "Company ID that owns the job",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  company_id: string;

  @ApiProperty({
    description: "Job status: DRAFT, PUBLISH, CLOSE",
    enum: JobStatus,
    example: JobStatus.PUBLISH,
  })
  status: JobStatus;

  @ApiProperty({
    description: "Job title",
    example: "Software Engineering",
  })
  title: string;

  @ApiProperty({
    description: "Job location (region full name or other_region + other_country for outside Indonesia)",
    example: "Kota Adm. Jakarta Pusat, Dki Jakarta",
  })
  location: string;

  @ApiProperty({
    description: "Company brand name",
    example: "Konami",
  })
  company_name: string;

  @ApiProperty({
    description: "Company logo URL (relative or absolute)",
    example: "media/image/id-1731747133754-2197",
  })
  company_logo_url: string;

  @ApiProperty({
    description: "Job description",
    example: "Making awesome project",
  })
  description: string;

  @ApiProperty({
    description: "Employment type(s): full-time, part-time, contract, etc.",
    example: ["full-time", "part-time", "contract"],
    type: [String],
  })
  employment_status: string[];

  @ApiProperty({
    description: "Work arrangement: on-site, remote, hybrid, etc.",
    example: ["on-site", "remote"],
    type: [String],
  })
  domicile_status: string[];

  @ApiProperty({
    type: String,
    format: "date",
    description: "Date when the job is automatically published (optional). Date-only (YYYY-MM-DD) in GMT+7 (WIB).",
    example: "2025-03-01",
    nullable: true,
    required: false,
  })
  open_date?: string | null;

  @ApiProperty({
    type: String,
    format: "date",
    description: "Date when the job is automatically closed (optional). Date-only (YYYY-MM-DD) in GMT+7 (WIB).",
    example: "2025-06-30",
    nullable: true,
    required: false,
  })
  close_date?: string | null;

  @ApiProperty({
    type: String,
    format: "date-time",
    description: "When the job was created (ISO 8601)",
    example: "2025-03-01T10:00:00.000Z",
  })
  created_at: Date;

  @ApiProperty({
    type: String,
    format: "date-time",
    description: "When the job was last updated (ISO 8601)",
    example: "2025-03-05T14:30:00.000Z",
  })
  updated_at: Date;
}
