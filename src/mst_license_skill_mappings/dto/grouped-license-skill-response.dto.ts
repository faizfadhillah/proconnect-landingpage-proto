import { ApiProperty } from "@nestjs/swagger";
import { MstLicense } from "../../mst_licenses/entities/mst_license.entity";
import { MstSkill } from "../../mst_skills/entities/mst_skill.entity";

export class GroupedLicenseSkillResponseDto {
  @ApiProperty({
    description: "License object",
    type: MstLicense,
  })
  license: MstLicense;

  @ApiProperty({
    description: "List of skills for this license",
    type: [MstSkill],
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174002",
        name: "JavaScript",
        created_at: "2023-01-15T00:00:00.000Z",
        updated_at: "2023-01-15T00:00:00.000Z",
      },
    ],
  })
  skills: MstSkill[];
}
