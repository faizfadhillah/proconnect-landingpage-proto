import {
  IsUUID,
  IsString,
  Length,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateIf,
  IsNotEmpty,
  IsDate,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { JobStatus } from "../entities/job.entity";
import { CloseDateInFuture, CloseDateAfterOpenDate } from "../validators/job-date.validators";
import { parseDateOnlyGMT7 } from "src/utils/date.util";

export class CreateJobDto {
  @ApiProperty({
    type: String,
    description: "The ID of the company offering the job",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @IsOptional()
  company_id: string;

  @ApiProperty({
    type: String,
    description: "The title of the job position",
    example: "Senior Software Engineer",
  })
  @IsString()
  @Length(7, 255)
  title: string;

  @ApiProperty({
    type: String,
    description: "Detailed description of the job",
    example: "We are looking for an experienced software engineer...",
  })
  @ValidateIf((obj) => obj.status === JobStatus.PUBLISH)
  @IsNotEmpty({
    message: "Description is mandatory. Please complete the description.",
  })
  description: string;

  @ApiProperty({
    type: String,
    description: "The ID of the region where the job is located",
    example: "13.71",
  })
  @IsOptional()
  region_id: string;

  @ApiProperty({
    type: Boolean,
    description: "is outside indo",
    example: false,
  })
  @IsOptional()
  is_outside_indo: boolean;

  @ApiProperty({
    type: String,
    description: "The other country out of indonesia",
    example: "US",
    nullable: true,
  })
  @IsString()
  @Length(3, 512)
  @IsOptional()
  other_country: string | null;

  @ApiProperty({
    type: String,
    description: "The other region out of indonesia",
    example: "California",
    nullable: true,
  })
  @IsString()
  @Length(3, 512)
  @IsOptional()
  other_region: string | null;

  @ApiProperty({
    type: String,
    description: "The salary pay interval",
    example: "monthly",
    nullable: true,
  })
  @IsString()
  @Length(1, 64)
  @IsOptional()
  salary_pay_interval: string | null;

  @ApiProperty({
    type: String,
    description: "The ID of the SalaryCountry",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsOptional()
  @IsUUID()
  salary_country_id: string;

  @ApiProperty({
    type: Number,
    description: "The min of the SalaryCountry",
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  min_salary: number;

  @ApiProperty({
    type: Number,
    description: "The max of the SalaryCountry",
    example: 150000,
  })
  @IsNumber()
  @IsOptional()
  max_salary: number;

  @ApiProperty({
    type: String,
    required: false,
    enum: JobStatus,
    description: "the status of jobs",
    example: "DRAFT",
  })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiProperty({
    type: Array,
    description: "The employment status",
    example: ["full-time"],
  })
  @IsOptional()
  employment_status: any;

  @ApiProperty({
    type: Array,
    description: "The domicile status",
    example: ["on-site", "remote"],
  })
  @IsOptional()
  domicile_status: any;

  @ApiProperty({
    type: Array,
    description: "The multi interest id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @IsOptional()
  @IsArray()
  interest_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The multi skill id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @IsOptional()
  @IsArray()
  skill_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The multi profession id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @IsOptional()
  @IsArray()
  profession_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The multi right_to_work id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @IsOptional()
  @IsArray()
  right_to_work_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The mastered languages",
    example: ["en", "id"],
  })
  @IsOptional()
  @IsArray()
  language_ids: string[];

  @ApiProperty({
    type: Object,
    description: "Additional configuration for the job",
    example: { salary_range: { min: 50000, max: 80000 } },
  })
  config: Record<string, any>;

  @ApiProperty({
    type: String,
    format: "date",
    description: "Date when the job is automatically published (optional). Date-only format (YYYY-MM-DD) in GMT+7 (WIB) timezone, interpreted as 00:00 GMT+7.",
    example: "2025-03-01",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => parseDateOnlyGMT7(value))
  @ValidateIf((_o, v) => v != null)
  @IsDate()
  open_date?: Date | null;

  @ApiProperty({
    type: String,
    format: "date",
    description: "Date when the job is automatically closed (optional). Min D+1 (not today). Date-only format (YYYY-MM-DD) in GMT+7 (WIB) timezone, interpreted as 00:00 GMT+7.",
    example: "2025-06-30",
    nullable: true,
    required: false,
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => parseDateOnlyGMT7(value))
  @ValidateIf((_o, v) => v != null)
  @IsDate()
  @CloseDateInFuture()
  @CloseDateAfterOpenDate()
  close_date?: Date | null;
}
