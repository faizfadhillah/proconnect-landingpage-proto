import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Length,
} from "class-validator";

export class CreatePendingStudentVerificationDto {
  @ApiProperty({
    description: "Student identifier (unique per school)",
    example: "1312022008",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  student_id: string;

  @ApiProperty({
    description: "School ID",
    example: "c6e2fb7c-2e6c-4fb3-93bf-6c24d2dba1d2",
  })
  @IsUUID()
  @IsNotEmpty()
  school_id: string;

  @ApiProperty({
    description: "Full name (optional)",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiProperty({
    description: "Photo URL (optional)",
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photo_url?: string;

  @ApiProperty({
    description: "Email (optional)",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: "Phone number (optional)",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone_num?: string;

  @ApiProperty({
    description: "Major (optional)",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  major?: string;

  @ApiProperty({
    description: "Major ID (optional)",
    example: "c6e2fb7c-2e6c-4fb3-93bf-6c24d2dba1d2",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  major_id?: string;

  @ApiProperty({
    description: "Education Degree",
    example: "S1",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  degree: string;

  @ApiProperty({
    description: "Diploma Level (e.g., L1, L2, L3)",
    example: "L2",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: "Diploma level must be between 1 and 50 characters" })
  diploma_level?: string;
}

