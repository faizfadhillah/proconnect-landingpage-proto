import { ApiProperty } from "@nestjs/swagger";
import { ApprovalState } from "../../common/enums/approval-state.enum";
import { StudentLicenseResponseDto } from "./student-license-response.dto";

export class StudentEducationDetailDto {
  @ApiProperty({
    description: "Student ID",
    example: "STU-001",
    required: false,
  })
  student_id?: string;

  @ApiProperty({
    description: "User Education ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
    nullable: true,
  })
  user_education_id?: string | null;

  @ApiProperty({
    description: "Major name",
    example: "F&B",
    required: false,
  })
  major?: string;

  @ApiProperty({
    description: "Education degree",
    example: "S1",
    required: false,
    nullable: true,
  })
  degree?: string | null;

  @ApiProperty({
    description: "Diploma level",
    example: "L4",
    required: false,
    nullable: true,
  })
  diploma_level?: string | null;

  @ApiProperty({
    description: "Institution/School name",
    example: "SMAN 1 Jakarta",
    required: false,
  })
  institution_name?: string;

  @ApiProperty({
    description: "File URL for education document",
    example: "/uploads/ijazah.pdf",
    required: false,
  })
  file_url?: string;

  @ApiProperty({
    description: "Approval state",
    enum: ApprovalState,
    example: ApprovalState.WAITING_APPROVAL,
    required: false,
  })
  approval_state?: ApprovalState;

  @ApiProperty({
    description: "School ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  school_id?: string;

  @ApiProperty({
    description: "Major ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
    required: false,
    nullable: true,
  })
  major_id?: string | null;

  @ApiProperty({
    description: "Mapped licenses/certifications for this education",
    type: [StudentLicenseResponseDto],
    required: false,
  })
  mapped_licenses?: StudentLicenseResponseDto[];
}
