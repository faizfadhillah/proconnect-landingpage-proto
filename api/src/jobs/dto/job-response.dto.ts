// src\jobs\dto\job-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Job } from "../entities/job.entity";
import { dateToDateOnlyGMT7 } from "src/utils/date.util";

/**
 * Response DTO for Job. Use fromEntity(job) to populate from a Job entity
 * (formats open_date and close_date as date-only YYYY-MM-DD in GMT+7).
 */
export class JobResponseDto {
  [key: string]: any;

  @ApiProperty({
    type: String,
    format: "date",
    description: "Date when the job is automatically published (optional). Date-only format (YYYY-MM-DD) in GMT+7 (WIB) timezone.",
    example: "2025-03-01",
    nullable: true,
    required: false,
  })
  open_date?: string | null;

  @ApiProperty({
    type: String,
    format: "date",
    description: "Date when the job is automatically closed (optional). Date-only format (YYYY-MM-DD) in GMT+7 (WIB) timezone.",
    example: "2025-06-30",
    nullable: true,
    required: false,
  })
  close_date?: string | null;

  @ApiProperty({
    description: "Skill match percentage between job and user. Returns -1 if no skills in job (FE should display as '- %')",
    example: 85.5,
    type: Number,
    required: false,
  })
  skill_match?: number;

  /**
   * Populate response DTO from a Job entity.
   * Copies all job fields and formats open_date/close_date as date-only (YYYY-MM-DD) in GMT+7.
   */
  static fromEntity(job: Job, skillMatch?: number): JobResponseDto {
    const dto = new JobResponseDto();
    Object.assign(dto, job);
    const out = JobResponseDto.formatOpenCloseDates(dto);
    out.skill_match = skillMatch;
    return out as JobResponseDto;
  }

  /**
   * Ensure open_date and close_date on an item are formatted as YYYY-MM-DD in GMT+7.
   * Accepts entity (Date) or already-formatted (string). Use for any GET response (search, findAll, etc.).
   */
  static formatOpenCloseDates<T extends Record<string, any>>(item: T): T {
    if (!item) return item;
    return {
      ...item,
      open_date:
        item.open_date instanceof Date
          ? dateToDateOnlyGMT7(item.open_date)
          : (item.open_date ?? null),
      close_date:
        item.close_date instanceof Date
          ? dateToDateOnlyGMT7(item.close_date)
          : (item.close_date ?? null),
    } as T;
  }
}
