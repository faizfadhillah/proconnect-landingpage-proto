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

export class CreateUserEducationDto {
  @ApiProperty({
    type: String,
    description: "The id of the user",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: "The ID of school_id is optional",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @IsUUID()
  @IsOptional()
  school_id: string;

  @ApiProperty({
    description: "The name of education degree",
    example: "S1",
    maxLength: 32,
  })
  @IsString()
  @Length(1, 32)
  education_degree: string;

  @ApiProperty({
    type: String,
    description: "The name of the institution",
    example: "Harvard University",
  })
  @IsString()
  @Length(3, 255)
  institution_name: string;

  @ApiProperty({
    type: String,
    description: "The major of study",
    example: "Computer Science",
  })
  @IsString()
  @Length(3, 255)
  major: string;

  @ApiProperty({
    type: String,
    description: "The ID of the major",
    example: "123e4567-e89b-12d3-a456-426614174002",
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  major_id: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The ID of the region the user belongs to",
    example: "13.71",
  })
  @IsOptional()
  @Length(1, 16)
  region_id?: string;

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
  @IsOptional()
  @IsString()
  @Length(0, 512)
  other_country: string | null;

  @ApiProperty({
    type: String,
    description: "The other region out of indonesia",
    example: "California",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(0, 512)
  other_region: string | null;

  @ApiProperty({
    type: Date,
    description: "The start date of education",
    example: "2020-09-01",
  })
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({
    type: Date,
    description: "The end date of education",
    example: "2024-06-30",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiProperty({
    type: Boolean,
    description: "Whether this is the current education",
    example: true,
  })
  @IsBoolean()
  is_current: boolean;

  @ApiProperty({
    type: String,
    description: "The File Url Of Ijazah",
    example: "/ijazah.pdf",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  file_url: string;

  @ApiProperty({
    description: "The student id of the education",
    example: "1312022008",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  student_id: string;

  @ApiProperty({
    description: "The certificate number of the education",
    example: "UI923892830-12981829",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  certificate_number: string;

  @ApiProperty({
    description: "The curriculum year of the education",
    example: "2020/2021",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  curriculum_year: string;

  @ApiProperty({
    description: "The diploma level",
    example: "L4",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  diploma_level?: string;
}
