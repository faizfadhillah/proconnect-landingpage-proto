import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";

export class GetGroupedFiltersDto {
  @ApiProperty({
    description: "Filter by school name (case-insensitive partial match)",
    example: "Universitas Indonesia",
    required: false,
  })
  @IsOptional()
  @IsString()
  school_name?: string;

  @ApiProperty({
    description: "Filter by major name (case-insensitive partial match)",
    example: "Computer Science",
    required: false,
  })
  @IsOptional()
  @IsString()
  major_name?: string;

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




