import { ApiProperty } from '@nestjs/swagger';
import {
  UserRoleAssignmentRole,
  UserRoleAssignmentCompanyRole,
  UserRoleAssignmentStatus,
} from '../enums/user_role_assignment.enums';

export abstract class BaseUserRoleAssignmentResponseDto {
  @ApiProperty({
    description: 'Role assignment ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  user_id: string;

  @ApiProperty({
    description: 'Company HQ ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  company_hq_id: string | null;

  @ApiProperty({
    description: 'Company ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  company_id: string | null;

  @ApiProperty({
    description: 'Department ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  dept_id: string | null;

  @ApiProperty({
    description: 'Company role',
    enum: UserRoleAssignmentCompanyRole,
    example: UserRoleAssignmentCompanyRole.OWNER_HQ,
    nullable: true,
  })
  company_role: UserRoleAssignmentCompanyRole | null;

  @ApiProperty({
    description: 'Role',
    enum: UserRoleAssignmentRole,
    example: UserRoleAssignmentRole.EMPLOYER,
  })
  role: UserRoleAssignmentRole;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
    nullable: true,
  })
  start_date: string | null;

  @ApiProperty({
    description: 'End date',
    example: '2024-12-31',
    nullable: true,
  })
  end_date: string | null;

  @ApiProperty({
    description: 'Status',
    enum: UserRoleAssignmentStatus,
    example: UserRoleAssignmentStatus.ACTIVE,
  })
  status: UserRoleAssignmentStatus;

  @ApiProperty({
    description: 'Employment type',
    example: 'Full-time',
    nullable: true,
  })
  employment_type: string | null;

  @ApiProperty({
    description: 'Profession ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  profession_id: string | null;

  @ApiProperty({
    description: 'School ID (if role is PIC_SCHOOL)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  school_id: string | null;

  @ApiProperty({
    description: 'Created date',
    example: '2024-01-01T00:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated date',
    example: '2024-01-01T00:00:00Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Created by user ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  created_by: string | null;

  @ApiProperty({
    description: 'Updated by user ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  updated_by: string | null;
}