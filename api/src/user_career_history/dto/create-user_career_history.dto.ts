import {
  IsUUID,
  IsString,
  IsDate,
  IsBoolean,
  IsOptional,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateUserCareerHistoryDto {
  @ApiProperty({
    type: String,
    description: "The id of the user",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: "The name of the company",
    example: "Acme Corporation",
  })
  @IsString()
  @Length(3, 255)
  company_name: string;

  @ApiProperty({
    type: String,
    description: "The profession_id of the mst-professions",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @IsOptional()
  profession_id: string;

  @ApiProperty({
    type: String,
    description: "The job title",
    example: "Software Engineer (di isi jika pilih others pada profession_id)",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  job_title: string;

  @ApiProperty({
    type: Date,
    description: "The start date of the job",
    example: "2020-01-01",
  })
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({
    type: Date,
    description: "The end date of the job",
    example: "2023-01-01",
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  end_date?: Date;

  @ApiProperty({
    type: Boolean,
    description: "Whether this is the current job",
    example: false,
  })
  @IsBoolean()
  is_current: boolean;

  @ApiProperty({
    type: String,
    description: "The job description",
    example:
      "Developed and maintained web applications using React and Node.js",
  })
  @IsString()
  job_description: string;
}
