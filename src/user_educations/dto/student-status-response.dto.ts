import { ApiProperty } from "@nestjs/swagger";
import { StudentVerificationStatus } from "../enums/student-verification-status.enum";
import { AccountStatus } from "../enums/account-status.enum";
import { StudentLicenseResponseDto } from "./student-license-response.dto";
import { StudentEducationDetailDto } from "./student-education-detail.dto";

export class StudentStatusResponseDto {
  @ApiProperty({
    description: "List of student identifiers",
    example: ["1312022008", "1312022009"],
    type: [String],
  })
  student_ids: string[];

  @ApiProperty({
    description: "Full name",
    example: "Jane Doe",
    required: false,
    nullable: true,
  })
  full_name?: string | null;

  @ApiProperty({
    description: "Photo URL",
    example: "http://cdn.example.com/photo.png",
    required: false,
    nullable: true,
  })
  photo_url?: string | null;

  @ApiProperty({
    description: "Email",
    example: "user@example.com",
    required: false,
    nullable: true,
  })
  email?: string | null;

  @ApiProperty({
    description: "Phone number",
    example: "+62123456789",
    required: false,
    nullable: true,
  })
  phone_num?: string | null;

  @ApiProperty({
    description: "List of majors for this student",
    example: ["Computer Science", "Engineering"],
    type: [String],
    required: false,
  })
  majors?: string[];

  @ApiProperty({
    description: "List of education details with major, degree, diploma level, and institution name",
    type: [StudentEducationDetailDto],
    required: false,
  })
  educations?: StudentEducationDetailDto[];

  @ApiProperty({
    description: "Verification status",
    enum: StudentVerificationStatus,
    example: StudentVerificationStatus.VERIFIED,
  })
  status: StudentVerificationStatus;

  @ApiProperty({
    description: "Account status (joined = user exists, not_joined = user not found)",
    enum: AccountStatus,
    example: AccountStatus.JOINED,
  })
  account_status: AccountStatus;

  @ApiProperty({
    description: "List of licenses/certificates with associated skills for this student",
    type: [StudentLicenseResponseDto],
    required: false,
  })
  licenses?: StudentLicenseResponseDto[];
}

