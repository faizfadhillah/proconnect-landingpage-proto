import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateNested } from "class-validator";
import { UpsertUserRoleAssignmentDto } from "../../user_role_assignments/dto/upsert_user_role_assignment.dto";
import { Type } from "class-transformer";
import { UserRoleAssignmentCompanyRole, UserRoleAssignmentRole, UserRoleAssignmentStatus } from "src/user_role_assignments/enums/user_role_assignment.enums";

export class UpdatedPlacementDto {
  @ApiProperty({
    description: 'Company ID (required for EMPLOYER role)',
    example: '52be2436-be3e-43f0-9cdb-3e3fb40dd0c3',
    required: true,
  })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id: string;

  @ApiProperty({
    description: 'Department ID (optional for EMPLOYER role)',
    example: '52be2436-be3e-43f0-9cdb-3e3fb40dd0c3',
    required: false,
  })
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  dept_id: string;

  @ApiProperty({
    description: 'Company role (required for EMPLOYER role)',
    enum: UserRoleAssignmentCompanyRole,
    example: UserRoleAssignmentCompanyRole.MEMBER,
    required: true,
  })
  @IsEnum(UserRoleAssignmentCompanyRole)
  company_role: UserRoleAssignmentCompanyRole;

  @ApiProperty({
    description: 'Employment type',
    example: 'Full-time',
    required: false,
  })
  @IsString()
  employment_type: string;

  @ApiProperty({
    description: 'Profession ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID('4', { message: 'Profession ID must be a valid UUID' })
  profession_id: string;

  static toUpsertUserRoleAssignmentDto(updatedPlacementDto: UpdatedPlacementDto, userId: string, companyHqId: string): UpsertUserRoleAssignmentDto {
    const upsertUserRoleAssignmentDto = new UpsertUserRoleAssignmentDto();
    upsertUserRoleAssignmentDto.user_id = userId;
    upsertUserRoleAssignmentDto.company_hq_id = companyHqId;
    upsertUserRoleAssignmentDto.company_id = updatedPlacementDto.company_id || companyHqId;
    upsertUserRoleAssignmentDto.dept_id = updatedPlacementDto.dept_id;
    upsertUserRoleAssignmentDto.company_role = updatedPlacementDto.company_role;
    upsertUserRoleAssignmentDto.role = UserRoleAssignmentRole.EMPLOYER;
    upsertUserRoleAssignmentDto.status = UserRoleAssignmentStatus.ACTIVE;
    upsertUserRoleAssignmentDto.employment_type = updatedPlacementDto.employment_type;
    upsertUserRoleAssignmentDto.profession_id = updatedPlacementDto.profession_id;
    upsertUserRoleAssignmentDto.start_date = new Date().toISOString().split('T')[0];
    return upsertUserRoleAssignmentDto;
  }
}

export class TransferOwnershipDto {
  @ApiProperty({
    description: "New owner user ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsUUID("4", { message: "New owner user ID must be a valid UUID" })
  new_owner_user_id: string;

  @ApiProperty({
    description: "Company HQ ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsUUID("4", { message: "Company HQ ID must be a valid UUID" })
  company_hq_id: string;

  @ApiProperty({
    description: "Updated placement for the new owner",
    type: UpdatedPlacementDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdatedPlacementDto)
  updated_placement: UpdatedPlacementDto;
}
