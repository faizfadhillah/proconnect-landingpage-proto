import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  Length,
  IsArray,
  ValidateNested,
  IsUUID,
  ArrayMinSize,
} from "class-validator";
import {
  UserGender,
} from "../../users/entities/user.entity";
import { UpsertUserRoleAssignmentDto } from "src/user_role_assignments/dto/upsert_user_role_assignment.dto";
import { UniqueAssignmentCombination } from "src/user_role_assignments/validators/unique-assignment-combination.validator";
import { Type } from "class-transformer";

export class UpsertMemberDto {
  @ApiProperty({
    type: String,
    required: false,
    description: "The ID of the company the user belongs to (Populate with HQ Company ID)",
    example: "12345678-1234-1234-1234-1234567890ab",
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The full name of the user",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  full_name?: string;

  @ApiProperty({
    type: String,
    example: "user@example.com",
  })
  @IsEmail()
  @Length(5, 255)
  email: string;

  @ApiProperty({
    type: String,
    example: "+6282288456789",
  })
  @IsString()
  @IsOptional()
  @Length(0, 64)
  phone: string;

  @ApiProperty({
    type: String,
    example: "http://image.jpg",
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  photo_url: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The ID of the region the user belongs to",
    example: "13.71",
  })
  @IsOptional()
  @Length(0, 16)
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
  @IsString()
  @IsOptional()
  @Length(0, 512)
  other_country: string | null;

  @ApiProperty({
    type: String,
    description: "The other region out of indonesia",
    example: "California",
    nullable: true,
  })
  @IsString()
  @Length(0, 512)
  @IsOptional()
  other_region: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "The gender of the user",
    example: "male",
    enum: UserGender,
  })
  @IsEnum(UserGender)
  @IsOptional()
  gender?: UserGender;

  @ApiProperty({
    type: String,
    description: "The postal code of indonesia",
    example: "27172",
    nullable: true,
  })
  @Length(0, 16)
  @IsOptional()
  postal_code: string | null;

  @ApiProperty({
    type: String,
    description: "The encrypted phone of the user",
    example: "1234567890",
    nullable: true,
  })
  @IsOptional()
  encrypted_phone: string | null;

  @ApiProperty({
    type: String,
    description: "The encrypted date of birth of the user",
    example: "2025-01-01",
    nullable: true,
  })
  @IsOptional()
  encrypted_date_of_birth: string | null;

  @ApiProperty({
    type: String,
    description: "The encrypted address of the user",
    example: "Jl. Raya No. 123, Jakarta",
    nullable: true,
  })
  @IsOptional()
  encrypted_address: string | null;

  @ApiProperty({
    type: String,
    description: "The encrypted nik of the user",
    example: "1234567890",
    nullable: true,
  })
  @IsOptional()
  encrypted_nik: string | null;

  @ApiProperty({
    description: 'Array of role assignments to upsert (create or update)',
    type: [UpsertUserRoleAssignmentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @UniqueAssignmentCombination()
  @Type(() => UpsertUserRoleAssignmentDto)
  assignments: UpsertUserRoleAssignmentDto[];
}
