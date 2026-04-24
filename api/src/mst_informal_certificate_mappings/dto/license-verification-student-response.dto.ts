import { ApiProperty } from "@nestjs/swagger";
import { StudentLicenseResponseDto } from "../../user_educations/dto/student-license-response.dto";
import { ApprovalState } from "../../common/enums/approval-state.enum";

export class LicenseVerificationStudentResponseDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  user_id: string;

  @ApiProperty({
    description: "Student full name",
    example: "John Doe",
    nullable: true,
  })
  full_name?: string | null;

  @ApiProperty({
    description: "Student photo URL",
    example: "https://example.com/photo.jpg",
    nullable: true,
  })
  photo_url?: string | null;

  @ApiProperty({
    description: "Student email",
    example: "john.doe@example.com",
    nullable: true,
  })
  email?: string | null;

  @ApiProperty({
    description: "Student phone number",
    example: "+6281234567890",
    nullable: true,
  })
  phone?: string | null;

  @ApiProperty({
    description: "Total number of licenses",
    example: 2,
  })
  total_licenses: number;

  @ApiProperty({
    description: "List of licenses with skills",
    type: [StudentLicenseResponseDto],
  })
  licenses: StudentLicenseResponseDto[];
}

export class LicenseVerificationSummaryDto {
  @ApiProperty({
    description: "Total number of students",
    example: 5,
  })
  total_students: number;

  @ApiProperty({
    description: "Number of verified licenses",
    example: 1,
  })
  verified_licenses: number;

  @ApiProperty({
    description: "Number of pending licenses",
    example: 2,
  })
  pending_licenses: number;

  @ApiProperty({
    description: "Number of students being shown",
    example: 5,
  })
  showing_students: number;
}

export class LicenseVerificationResponseDto {
  @ApiProperty({
    description: "Summary statistics",
    type: LicenseVerificationSummaryDto,
  })
  summary: LicenseVerificationSummaryDto;

  @ApiProperty({
    description: "List of students with licenses",
    type: [LicenseVerificationStudentResponseDto],
  })
  students: LicenseVerificationStudentResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}


