import { ApiProperty, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  Length,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
} from "class-validator";
import { CreateUserDto } from "./create-user.dto";
import { UpsertUserRoleAssignmentDto } from "src/user_role_assignments/dto/upsert_user_role_assignment.dto";
import { UniqueAssignmentCombination } from "src/user_role_assignments/validators/unique-assignment-combination.validator";
import { Type } from "class-transformer";
import { UserRole } from "../entities/user.entity";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    type: String,
    required: false,
    description: "The email address of the user",
    example: "user@example.com",
  })
  @IsEmail()
  @IsOptional()
  @Length(3, 255)
  email?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The ID of the company the user belongs to",
    example: "12345678-1234-1234-1234-1234567890ab",
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The full name of the user",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  @Length(3, 255)
  full_name?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The photo profile URL",
    example: "http://image.png",
  })
  @IsString()
  @IsOptional()
  @Length(0, 3000)
  photo_url: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The gender of the user",
    example: "male",
  })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  gender?: string;

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
  @Length(2, 512)
  other_country: string | null;

  @ApiProperty({
    type: String,
    description: "The other region out of indonesia",
    example: "California",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(3, 512)
  other_region: string | null;

  @ApiProperty({
    type: String,
    description: "The postal code of indonesia",
    example: "27172",
    nullable: true,
  })
  @IsOptional()
  @Length(3, 16)
  postal_code: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "The personal summary of the user",
    example: "I am a software engineer with 5 years of experience.",
  })
  @IsOptional()
  @IsString()
  personal_summary?: string;

  /*@IsOptional()
  @ApiProperty({
    type: Object,
    required: false,
  })
  language?: any;*/

  @ApiProperty({
    type: String,
    required: false,
    description: "The availability of the user",
    example: "2 weeks",
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  availability?: string;

  @ApiProperty({
    type: String,
    description: "The domicilie status of the user",
    example: "full-time, contract",
    nullable: true,
  })
  @IsOptional()
  @Length(0, 50)
  employment_status: string | null;

  @ApiProperty({
    type: String,
    description: "The domicile status of the user",
    example: "on-site, remote",
    nullable: true,
  })
  @IsOptional()
  @Length(0, 50)
  domicile_status: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description: "The preferred work types of the user",
    example: "project management, software development",
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  preferred_work_types?: string;

  @ApiProperty({
    type: Object,
    required: false,
    example: [{ city: "New York", state: "New York", country: "USA" }],
  })
  @IsOptional()
  preferred_locations?: any;

  @ApiProperty({
    type: String,
    example: "mXM8iPgjXSPno1D0f7oVO5csZao1",
  })
  @IsString()
  @IsOptional()
  @Length(3, 255)
  firebase_uid?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "The role of the user",
    example: "candidate",
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  user_role?: UserRole;

  @ApiProperty({
    type: String,
    description: "The last wizard state",
    example: 0,
  })
  @IsInt()
  @IsOptional()
  last_wizard_state: number;

  @ApiProperty({
    type: "object",
    description: "The wizard state",
    example: {},
  })
  @IsOptional()
  wizard_state: any;

  /*@IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  salary_expectation?: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsString()
  classification_of_interest?: string;*/

  @ApiProperty({
    description: 'Array of role assignments to upsert (create or update)',
    type: [UpsertUserRoleAssignmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @UniqueAssignmentCombination()
  @Type(() => UpsertUserRoleAssignmentDto)
  assignments: UpsertUserRoleAssignmentDto[];
}
