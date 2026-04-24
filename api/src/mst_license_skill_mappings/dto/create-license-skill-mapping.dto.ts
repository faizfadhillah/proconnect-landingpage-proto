import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CreateLicenseSkillMappingDto {
  @ApiProperty({
    description: "License ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID("4", { message: "License ID must be a valid UUID" })
  license_id: string;

  @ApiProperty({
    description: "Skill ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @IsUUID("4", { message: "Skill ID must be a valid UUID" })
  skill_id: string;
}

