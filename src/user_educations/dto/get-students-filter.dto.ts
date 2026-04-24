import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsUUID, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";
import { StudentVerificationStatus } from "../enums/student-verification-status.enum";
import { AccountStatus } from "../enums/account-status.enum";

export class GetStudentsFilterDto {
  @ApiProperty({
    description: "Filter by school ID",
    example: "c6e2fb7c-2e6c-4fb3-93bf-6c24d2dba1d2",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  school_id?: string;

  @ApiProperty({
    description: "Filter by user name (case-insensitive partial match)",
    example: "John",
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Filter by user email (case-insensitive partial match)",
    example: "user@example.com",
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: "Filter by major ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  major_id?: string;

  @ApiProperty({
    description: "Filter by verification status",
    enum: StudentVerificationStatus,
    example: StudentVerificationStatus.VERIFIED,
    required: false,
  })
  @IsOptional()
  @IsEnum(StudentVerificationStatus)
  verification_status?: StudentVerificationStatus;

  @ApiProperty({
    description: "Filter by account status",
    enum: AccountStatus,
    example: AccountStatus.JOINED,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  account_status?: AccountStatus;

  @ApiProperty({
    description: "Page number",
    example: 1,
    required: false,
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
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

