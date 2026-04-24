import { ApiProperty } from "@nestjs/swagger";
import { UserRole, UserGender, CompanyRole } from "src/users/entities/user.entity";
import { UserRoleAssignmentHistoryResponseDto } from "src/user_role_assignments/dto/user_role_assignment_history_response.dto";

export class UpsertMemberResponseDto {
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

  @ApiProperty()
  encrypted_date_of_birth: string | null;

  @ApiProperty()
  encrypted_nik: string | null;

  @ApiProperty()
  encrypted_phone: string | null;

  @ApiProperty()
  encrypted_address: string | null;

  @ApiProperty({
    type: () => UserRoleAssignmentHistoryResponseDto,
    isArray: true,
    description: "The role assignments created/updated for the member",
  })
  assignments: UserRoleAssignmentHistoryResponseDto[];
}