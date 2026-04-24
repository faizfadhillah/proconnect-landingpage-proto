import { ApiProperty } from "@nestjs/swagger";
import { MstLicense } from "../../mst_licenses/entities/mst_license.entity";
import { MstSchool } from "../../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../../mst_majors/entities/mst_major.entity";

export class GroupedEducationLicenseResponseDto {
  @ApiProperty({
    description: "Education Degree",
    example: "S1",
  })
  degree: string;

  @ApiProperty({
    description: "Diploma Level (e.g., L1, L2, L3). Null = wildcard (any level).",
    example: "L2",
    nullable: true,
  })
  diploma_level: string | null;

  @ApiProperty({
    description: "School object",
    type: MstSchool,
  })
  school: MstSchool;

  @ApiProperty({
    description: "Major object",
    type: MstMajor,
  })
  major: MstMajor;

  @ApiProperty({
    description: "List of licenses for this education combination",
    type: [MstLicense],
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174003",
        license_template_code: "CPA-TEMPLATE-001",
        license_name: "Certified Public Accountant",
        issuing_organization: "American Institute of CPAs",
        issue_date: "2023-01-15",
      },
    ],
  })
  licenses: MstLicense[];
}
