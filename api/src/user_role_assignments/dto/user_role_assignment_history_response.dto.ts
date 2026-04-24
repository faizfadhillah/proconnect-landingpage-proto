import { ApiProperty } from '@nestjs/swagger';
import { BaseUserRoleAssignmentResponseDto } from './base_user_role_assignment_response.dto';
import { UserRoleAssignmentHistory } from '../entities/user_role_assignment_history.entity';
import { formatDateToYYYYMMDD } from '../../utils/date-format.util';

export class UserRoleAssignmentHistoryResponseDto extends BaseUserRoleAssignmentResponseDto {
  @ApiProperty({ 
    description: 'History record ID', 
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  role_assignment_history_id: string;

  @ApiProperty({ 
    description: 'Role assignment ID (FK to main table)', 
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true 
  })
  role_assignment_id: string | null;
  
  /**
   * Map UserRoleAssignmentHistory entity to response DTO
   */
  static fromEntity(entity: UserRoleAssignmentHistory): UserRoleAssignmentHistoryResponseDto {
    const dto = new UserRoleAssignmentHistoryResponseDto();
    dto.id = entity.id;
    dto.role_assignment_history_id = entity.id;
    dto.role_assignment_id = entity.roleAssignmentId;
    dto.user_id = entity.userId;
    dto.company_hq_id = entity.companyHqId;
    dto.company_id = entity.companyId;
    dto.dept_id = entity.deptId;
    dto.company_role = entity.companyRole;
    dto.role = entity.role;
    dto.start_date = entity.startDate ? formatDateToYYYYMMDD(entity.startDate) : null;
    dto.end_date = entity.endDate ? formatDateToYYYYMMDD(entity.endDate) : null;
    dto.status = entity.status;
    dto.employment_type = entity.employmentType;
    dto.profession_id = entity.professionId;
    dto.school_id = entity.schoolId;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;
    dto.created_by = entity.created_by;
    dto.updated_by = entity.updated_by;
    return dto;
  }
}
