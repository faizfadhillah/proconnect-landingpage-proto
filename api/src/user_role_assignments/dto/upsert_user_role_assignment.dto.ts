import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { UserRoleAssignment } from '../entities/user_role_assignment.entity';
import { UserRoleAssignmentHistory } from '../entities/user_role_assignment_history.entity';
import { UserRoleAssignmentCompanyRole, UserRoleAssignmentRole, UserRoleAssignmentStatus } from '../enums/user_role_assignment.enums';
import { IsRoleConsistent, IsNotFutureDate, IsValidEndDate, IsDateRangeValid, IsStatusWithinDateRange } from '../validators/dto_validators';

export class UpsertUserRoleAssignmentDto {
  @ApiProperty({
    description: 'User ID',
    example: '7703a581-aa67-47b4-8215-c2c8924e7530',
  })
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  user_id: string;

  // Company HQ ID (required for EMPLOYER role), if not provided, will automatically search based on companyId
  @ApiProperty({
    description: 'Company HQ ID (required for EMPLOYER role)',
    example: '52be2436-be3e-43f0-9cdb-3e3fb40dd0c3',
    required: false,
  })
  @ValidateIf((o) => o.company_role && o.company_role !== '')
  @IsNotEmpty({ message: 'Company HQ ID is required for EMPLOYER role' })
  @IsUUID('4', { message: 'Company HQ ID must be a valid UUID' })
  company_hq_id: string;

  @ApiProperty({
    description: 'Company ID (required for EMPLOYER role)',
    example: '52be2436-be3e-43f0-9cdb-3e3fb40dd0c3',
    required: false,
  })
  @ValidateIf((o) => o.company_role && o.company_role !== '')
  @IsNotEmpty({ message: 'Company ID is required for EMPLOYER role' })
  @IsUUID('4', { message: 'Company ID must be a valid UUID' })
  company_id: string;

  @ApiProperty({
    description: 'Department ID (optional for EMPLOYER role)',
    example: '52be2436-be3e-43f0-9cdb-3e3fb40dd0c3',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Department ID must be a valid UUID' })
  dept_id?: string;

  @ApiProperty({
    description: 'Company role (required for EMPLOYER role)',
    enum: UserRoleAssignmentCompanyRole,
    example: UserRoleAssignmentCompanyRole.OWNER_HQ,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRoleAssignmentCompanyRole)
  company_role?: UserRoleAssignmentCompanyRole;

  @IsNotEmpty()
  @IsEnum(UserRoleAssignmentRole)
  @IsRoleConsistent()
  @ApiProperty({
    description: 'Role',
    enum: UserRoleAssignmentRole,
    example: UserRoleAssignmentRole.EMPLOYER,
  })
  role: UserRoleAssignmentRole;

  @ApiProperty({
    description: 'Start date (cannot be in the future)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @IsNotFutureDate()
  start_date?: string;

  @ApiProperty({
    description: 'End date (optional, can be future for contracts)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  @IsValidEndDate()
  @IsDateRangeValid()
  end_date?: string;

  @ApiProperty({
    description: 'Status',
    enum: UserRoleAssignmentStatus,
    example: UserRoleAssignmentStatus.ACTIVE,
    default: UserRoleAssignmentStatus.ACTIVE,
  })
  @IsEnum(UserRoleAssignmentStatus)
  @IsStatusWithinDateRange()
  status: UserRoleAssignmentStatus = UserRoleAssignmentStatus.ACTIVE;

  @ApiProperty({
    description: 'Employment type',
    example: 'Full-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  employment_type?: string;

  @ApiProperty({
    description: 'Profession ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Profession ID must be a valid UUID' })
  profession_id?: string;

  @ApiProperty({
    description: 'School ID (required when role is PIC_SCHOOL)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'School ID must be a valid UUID' })
  school_id?: string;

  @ApiProperty({
    description: 'Optional - if provided, updates existing history record',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  role_assignment_history_id?: string;

  /**
   * Convert DTO to UserRoleAssignment entity data
   */
  static toAssignmentEntity(dto: UpsertUserRoleAssignmentDto): Partial<UserRoleAssignment> {
    return {
      userId: dto.user_id,
      companyHqId: dto.company_hq_id || null,
      companyId: dto.company_id || null,
      deptId: dto.dept_id || null,
      companyRole: dto.company_role || null,
      role: dto.role,
      schoolId: dto.school_id || null,
      startDate: dto.start_date ? new Date(dto.start_date) : null,
      endDate: dto.end_date ? new Date(dto.end_date) : null,
      status: dto.status,
      employmentType: dto.employment_type || null,
      professionId: dto.profession_id || null,
    };
  }

  /**
   * Convert DTO to UserRoleAssignmentHistory entity data
   */
  static toHistoryEntity(dto: UpsertUserRoleAssignmentDto, roleAssignmentId: string | null = null): Partial<UserRoleAssignmentHistory> {
    return {
      userId: dto.user_id,
      companyHqId: dto.company_hq_id || null,
      companyId: dto.company_id || null,
      deptId: dto.dept_id || null,
      companyRole: dto.company_role || null,
      role: dto.role,
      schoolId: dto.school_id || null,
      startDate: dto.start_date ? new Date(dto.start_date) : null,
      endDate: dto.end_date ? new Date(dto.end_date) : null,
      status: dto.status,
      employmentType: dto.employment_type || null,
      professionId: dto.profession_id || null,
      roleAssignmentId,
    };
  }

  /**
   * Merge with existing history data and convert to UserRoleAssignmentHistory entity data
   */
  static toUpdatedHistoryEntity(dto: UpsertUserRoleAssignmentDto, existingHistory: UserRoleAssignmentHistory): Partial<UserRoleAssignmentHistory> {
    return {
      userId: dto.user_id ?? existingHistory.userId,
      companyHqId: dto.company_hq_id !== undefined ? dto.company_hq_id : existingHistory.companyHqId,
      companyId: dto.company_id !== undefined ? dto.company_id : existingHistory.companyId,
      deptId: dto.dept_id !== undefined ? dto.dept_id : existingHistory.deptId,
      companyRole: dto.company_role !== undefined ? dto.company_role : existingHistory.companyRole,
      role: dto.role ?? existingHistory.role,
      schoolId: dto.school_id !== undefined ? dto.school_id : existingHistory.schoolId,
      startDate: dto.start_date !== undefined ? (dto.start_date ? new Date(dto.start_date) : null) : existingHistory.startDate,
      endDate: dto.end_date !== undefined ? (dto.end_date ? new Date(dto.end_date) : null) : existingHistory.endDate,
      status: dto.status ?? existingHistory.status,
      employmentType: dto.employment_type !== undefined ? dto.employment_type : existingHistory.employmentType,
      professionId: dto.profession_id !== undefined ? dto.profession_id : existingHistory.professionId,
      roleAssignmentId: existingHistory.roleAssignmentId,
    };
  }

  /**
   * Convert updated history data to UserRoleAssignment entity data
   */
  static toAssignmentEntityFromHistory(historyData: Partial<UserRoleAssignmentHistory>): Partial<UserRoleAssignment> {
    return {
      userId: historyData.userId,
      companyHqId: historyData.companyHqId,
      companyId: historyData.companyId,
      deptId: historyData.deptId,
      companyRole: historyData.companyRole,
      role: historyData.role,
      schoolId: historyData.schoolId,
      startDate: historyData.startDate,
      endDate: historyData.endDate,
      status: historyData.status,
      employmentType: historyData.employmentType,
      professionId: historyData.professionId,
    };
  }
}
