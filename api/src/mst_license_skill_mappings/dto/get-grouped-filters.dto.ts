import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetGroupedFiltersDto {
  @ApiProperty({
    description: "Filter by license name (case-insensitive partial match)",
    example: "Certified Public Accountant",
    required: false,
  })
  @IsOptional()
  @IsString()
  license_name?: string;

  @ApiProperty({
    description: "Filter by skill name (case-insensitive partial match)",
    example: "JavaScript",
    required: false,
  })
  @IsOptional()
  @IsString()
  skill_name?: string;

  @ApiProperty({
    description: "Page number",
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: "Items per page",
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
