import { ApiProperty } from '@nestjs/swagger';
import { UserRoleAssignmentHistoryResponseDto } from '../../user_role_assignments/dto/user_role_assignment_history_response.dto';
import { formatDateToYYYYMMDD } from '../../utils/date-format.util';
import { decrypt } from '../../encrypted_user_data/encryption.util';

export class CompanyMemberResponseDto extends UserRoleAssignmentHistoryResponseDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe'
  })
  full_name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com'
  })
  email: string;

  @ApiProperty({
    description: 'User photo URL',
    example: 'https://example.com/photo.jpg',
    nullable: true
  })
  photo_url?: string;

  @ApiProperty({
    description: 'Company branch name',
    example: 'Jakarta Selatan',
    nullable: true
  })
  branch?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Google Indonesia'
  })
  company_name: string;

  @ApiProperty({
    description: 'Department name',
    example: 'Engineering',
    nullable: true
  })
  dept_name?: string;

  @ApiProperty({
    description: 'Profession name',
    example: 'Software Engineer',
    nullable: true
  })
  profession_name?: string;

  @ApiProperty({
    description: 'Encrypted date of birth',
    example: '1990-01-01',
    nullable: true
  })
  encrypted_date_of_birth?: string;

  @ApiProperty({
    description: 'Encrypted NIK',
    example: '1234567890123456',
    nullable: true
  })
  encrypted_nik?: string;

  @ApiProperty({
    description: 'Encrypted phone',
    example: '+62123456789',
    nullable: true
  })
  encrypted_phone?: string;

  @ApiProperty({
    description: 'Encrypted address',
    example: 'Jl. Example No. 1',
    nullable: true
  })
  encrypted_address?: string;

  /**
   * Create DTO from joined data (UserRoleAssignmentHistory + User)
   */
  static fromJoinedData(data: any): CompanyMemberResponseDto {
    const dto = new CompanyMemberResponseDto();

    // Map role assignment data
    dto.id = data.role_assignment_history_id;
    dto.role_assignment_history_id = data.role_assignment_history_id;
    dto.role_assignment_id = data.role_assignment_id;
    dto.user_id = data.user_id;
    dto.company_hq_id = data.company_hq_id;
    dto.company_id = data.company_id;
    dto.dept_id = data.dept_id;
    dto.company_role = data.company_role;
    dto.role = data.role;
    dto.start_date = data.start_date ? formatDateToYYYYMMDD(data.start_date) : null;
    dto.end_date = data.end_date ? formatDateToYYYYMMDD(data.end_date) : null;
    dto.status = data.status;
    dto.employment_type = data.employment_type;
    dto.profession_id = data.profession_id;
    dto.created_at = data.created_at;
    dto.updated_at = data.updated_at;
    dto.created_by = data.created_by;
    dto.updated_by = data.updated_by;

    // Map user data
    dto.full_name = data.full_name;
    dto.email = data.email;
    dto.photo_url = data.photo_url;

    // Map company data
    dto.branch = data.branch;
    dto.company_name = data.company_name;

    // Map department data
    dto.dept_name = data.dept_name;

    // Map profession data
    dto.profession_name = data.profession_name;

    // Map and decrypt encrypted user data
    dto.encrypted_date_of_birth = data.encrypted_date_of_birth ? decrypt(data.encrypted_date_of_birth) : null;
    dto.encrypted_nik = data.encrypted_nik ? decrypt(data.encrypted_nik) : null;
    dto.encrypted_phone = data.encrypted_phone ? decrypt(data.encrypted_phone) : null;
    dto.encrypted_address = data.encrypted_address ? decrypt(data.encrypted_address) : null;

    return dto;
  }
}