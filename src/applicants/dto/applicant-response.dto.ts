// src\applicants\dto\applicant-response.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { Applicant } from "../entities/applicant.entity";

export class ApplicantResponseDto extends Applicant {
  @ApiProperty({
    description: "Skill match percentage between job and user. Returns -1 if no skills in job (FE should display as '- %')",
    example: 85.5,
    type: Number,
  })
  skill_match: number;
}

