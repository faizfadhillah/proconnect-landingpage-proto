import { IsUUID, IsString, IsOptional, IsInt, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstAspCompetencyDto {
  @ApiProperty({
    type: String,
    description: "The primary division within the hotel services",
    example: "HOTEL",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  primary_division?: string;

  @ApiProperty({
    type: String,
    description: "The secondary division within the hotel services",
    example: "FRONT OFFICE",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  secondary_division?: string;

  @ApiProperty({
    type: String,
    description: "The job index number",
    example: "HFO.01",
  })
  @IsString()
  @IsOptional()
  @Length(0, 64)
  job_index_number?: string;

  @ApiProperty({
    type: String,
    description: "The title of the job position",
    example: "Front Office Manager",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  job_titles?: string;

  @ApiProperty({
    type: String,
    description: "The type of competency",
    example: "Functional Competencies",
  })
  @IsString()
  @IsOptional()
  @Length(0, 128)
  competency_type?: string;

  @ApiProperty({
    type: String,
    description: "The competency standard details",
    example: "Manage financial performance within a budget",
  })
  @IsString()
  @IsOptional()
  competency_standard?: string;

  @ApiProperty({
    type: String,
    description: "The competency cluster code",
    example: "D1.HFA.CL7.08",
  })
  @IsString()
  @IsOptional()
  @Length(0, 64)
  competency_cluster_code?: string;

  @ApiProperty({
    type: String,
    description: "The related skills, if applicable",
    example: "Financial management, Budgeting",
  })
  @IsString()
  @IsOptional()
  skills?: string;

  @ApiProperty({
    type: String,
    description: "The ID of the user who created the entry",
    example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  })
  @IsUUID()
  @IsOptional()
  created_by?: string;

  @ApiProperty({
    type: String,
    description: "The ID of the user who last updated the entry",
    example: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  })
  @IsUUID()
  @IsOptional()
  updated_by?: string;

  @ApiProperty({
    type: Number,
    description: "The version number of the entry",
    example: 1,
  })
  @IsInt()
  @IsOptional()
  version?: number;
}
