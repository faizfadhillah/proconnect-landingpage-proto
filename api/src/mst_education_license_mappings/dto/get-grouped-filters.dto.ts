import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, Min, IsUUID } from "class-validator";
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
    description: "Filter by school ID (exact match)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  school_id?: string;

  @ApiProperty({
    description: "Filter by major ID (exact match)",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  major_id?: string;

  @ApiProperty({
    description: "Filter by degree (exact match)",
    example: "S1",
    required: false,
  })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiProperty({
    description: "Filter by diploma level (exact match)",
    example: "L3",
    required: false,
  })
  @IsOptional()
  @IsString()
  diploma_level?: string;

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
