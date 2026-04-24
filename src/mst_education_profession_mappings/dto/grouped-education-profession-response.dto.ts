import { ApiProperty } from "@nestjs/swagger";
import { MstProfession } from "../../mst_professions/entities/mst_profession.entity";
import { MstSchool } from "../../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../../mst_majors/entities/mst_major.entity";

export class GroupedEducationProfessionResponseDto {
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
    description: "List of professions for this education combination",
    type: [MstProfession],
    example: [
      {
        id: "123e4567-e89b-12d3-a456-426614174003",
        name: "Software Engineer",
        level: 1,
        parent_id: null,
        tags: "technology, science",
        created_at: "2023-01-15T00:00:00.000Z",
        updated_at: "2023-01-15T00:00:00.000Z",
      },
    ],
  })
  professions: MstProfession[];
}




