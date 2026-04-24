import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsString, Length, IsOptional } from "class-validator";

export class CreateEducationProfessionMappingDto {
  @ApiProperty({
    description: "School ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID("4", { message: "School ID must be a valid UUID" })
  school_id: string;

  @ApiProperty({
    description: "Major ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @IsUUID("4", { message: "Major ID must be a valid UUID" })
  major_id: string;

  @ApiProperty({
    description: "Education Degree",
    example: "S1",
  })
  @IsString()
  @Length(1, 32)
  degree: string;

  @ApiProperty({
    description: "Diploma Level (e.g., L1, L2, L3). Omit or null = wildcard (any level).",
    example: "L2",
    maxLength: 50,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: "Diploma level must be between 1 and 50 characters" })
  diploma_level?: string | null;

  @ApiProperty({
    description: "Profession ID",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  @IsUUID("4", { message: "Profession ID must be a valid UUID" })
  profession_id: string;
}

