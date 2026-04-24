import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole, UserGender, CompanyRole } from 'src/users/entities/user.entity';
import { EncryptedUserData } from 'src/encrypted_user_data/entities/encrypted_user_data.entity';
import { CompanyMemberResponseDto } from './company-member-response.dto';
import { decrypt } from 'src/encrypted_user_data/encryption.util';

export class CompanyMemberDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  photo_url: string;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  user_role: UserRole;

  @ApiProperty()
  company_id: string | null;

  @ApiProperty({ enum: CompanyRole })
  company_role: CompanyRole;

  @ApiProperty({ enum: UserGender })
  gender: UserGender;

  @ApiProperty()
  birth_year: number;

  @ApiProperty()
  region_id: string | null;

  @ApiProperty()
  is_outside_indo: boolean;

  @ApiProperty()
  other_country: string | null;

  @ApiProperty()
  other_region: string | null;

  @ApiProperty()
  postal_code: string | null;

  @ApiProperty()
  personal_summary: string | null;

  @ApiProperty()
  availability: string | null;

  @ApiProperty()
  employment_status: string | null;

  @ApiProperty()
  domicile_status: string | null;

  @ApiProperty()
  preferred_work_types: string | null;

  @ApiProperty()
  preferred_locations: object | null;

  @ApiProperty()
  salary_expectation: string | null;

  @ApiProperty()
  firebase_uid: string;

  @ApiProperty()
  is_email_verified: boolean;

  @ApiProperty()
  is_school_verified: boolean;

  @ApiProperty()
  is_skill_passport_verified: boolean;

  @ApiProperty({ type: "object" })
  roles: any;

  @ApiProperty()
  last_wizard_state: number;

  @ApiProperty({ type: "object" })
  wizard_state: any;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  // Encrypted data fields
  @ApiProperty({
    description: 'Encrypted phone number',
    example: 'encrypted_phone_data',
    nullable: true
  })
  encrypted_phone?: string;

  @ApiProperty({
    description: 'Encrypted date of birth',
    example: 'encrypted_dob_data',
    nullable: true
  })
  encrypted_date_of_birth?: string;

  @ApiProperty({
    description: 'Encrypted address',
    example: 'encrypted_address_data',
    nullable: true
  })
  encrypted_address?: string;

  @ApiProperty({
    description: 'Encrypted NIK',
    example: 'encrypted_nik_data',
    nullable: true
  })
  encrypted_nik?: string;

  // Role assignment history with details
  @ApiProperty({
    type: () => CompanyMemberResponseDto,
    isArray: true,
    description: "Complete role assignment history for the member with detailed relations",
  })
  assignments: CompanyMemberResponseDto[];

  /**
   * Create DTO from user data, encrypted data, and role history
   */
  static fromData(
    user: User,
    encryptedData?: EncryptedUserData,
    assignments?: CompanyMemberResponseDto[]
  ): CompanyMemberDetailResponseDto {
    const dto = new CompanyMemberDetailResponseDto();

    // Map user data
    dto.id = user.id;
    dto.photo_url = user.photo_url;
    dto.full_name = user.full_name;
    dto.email = user.email;
    dto.user_role = user.user_role;
    dto.company_id = user.company_id;
    dto.company_role = user.company_role;
    dto.gender = user.gender;
    dto.birth_year = user.birth_year;
    dto.region_id = user.region_id;
    dto.is_outside_indo = user.is_outside_indo;
    dto.other_country = user.other_country;
    dto.other_region = user.other_region;
    dto.postal_code = user.postal_code;
    dto.personal_summary = user.personal_summary;
    dto.availability = user.availability;
    dto.employment_status = user.employment_status;
    dto.domicile_status = user.domicile_status;
    dto.preferred_work_types = user.preferred_work_types;
    dto.preferred_locations = user.preferred_locations;
    dto.salary_expectation = user.salary_expectation;
    dto.firebase_uid = user.firebase_uid;
    dto.is_email_verified = user.is_email_verified;
    dto.is_school_verified = user.is_school_verified;
    dto.is_skill_passport_verified = user.is_skill_passport_verified;
    dto.roles = user.roles;
    dto.last_wizard_state = user.last_wizard_state;
    dto.wizard_state = user.wizard_state;
    dto.created_at = user.created_at;
    dto.updated_at = user.updated_at;

    // Map encrypted data if available
    if (encryptedData) {
      dto.encrypted_phone = decrypt(encryptedData.encrypted_phone);
      dto.encrypted_date_of_birth = decrypt(encryptedData.encrypted_date_of_birth);
      dto.encrypted_address = decrypt(encryptedData.encrypted_address);
      dto.encrypted_nik = decrypt(encryptedData.encrypted_nik);
    }

    // Map role assignment history
    dto.assignments = assignments || [];

    return dto;
  }
}