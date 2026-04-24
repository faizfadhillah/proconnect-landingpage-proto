// src/user_right_to_work/dto/create-user-right-to-work.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class CreateUserRightToWorkDto {
  @ApiProperty({
    type: String,
    format: "uuid",
  })
  @IsUUID()
  user_id!: string;

  @ApiProperty({
    description: "The ID of the SalaryCountry",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @IsUUID()
  salary_country_id: string;

  @ApiProperty({
    type: String,
    format: "uuid",
  })
  @IsUUID()
  right_to_work_id!: string;

  @ApiProperty({
    description: "The file attachment url",
    example: "http://cdn.aseanta.com/file.pdf",
    maxLength: 255,
  })
  @IsOptional()
  file_url: string;
}
