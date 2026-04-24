import { ApiProperty } from "@nestjs/swagger";

export class UserInfoDto {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  user_id: string;

  @ApiProperty({
    description: "User full name",
    example: "John Doe",
  })
  name: string;

  @ApiProperty({
    description: "User location (region name or other location)",
    example: "Jakarta Selatan",
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: "User photo URL",
    example: "http://cdn.example.com/photo.jpg",
  })
  photo_url: string;

  @ApiProperty({
    description: "User occupation (profession name)",
    example: "Software Engineer",
    nullable: true,
  })
  occupation: string | null;

  @ApiProperty({
    description: "Status school verified",
    example: false,
    type: Boolean,
  })
  is_school_verified: boolean;

  @ApiProperty({
    description: "Status skill passport verified",
    example: false,
    type: Boolean,
  })
  is_skill_passport_verified: boolean;
}

export class SkillMatchDetailResponseDto {
  @ApiProperty({
    description: "Job name (title)",
    example: "Senior Software Engineer",
  })
  job_name: string;

  @ApiProperty({
    description: "Skill match percentage (0-100 or -1 if no skills in job)",
    example: 85,
    type: Number,
  })
  percentage: number;

  @ApiProperty({
    description: "Flag indicating if match is due to education-profession mapping and job title matches profession name",
    example: true,
    type: Boolean,
  })
  is_education_match: boolean;

  @ApiProperty({
    description: "User information",
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: "List of verified skill names that match job requirements",
    example: ["JavaScript", "TypeScript", "Node.js"],
    type: [String],
  })
  verified_match_skills: string[];

  @ApiProperty({
    description: "List of unverified skill names that match job requirements",
    example: ["React", "Vue.js"],
    type: [String],
  })
  unverified_match_skills: string[];

  @ApiProperty({
    description: "List of job skill names that user doesn't have",
    example: ["Python", "Docker"],
    type: [String],
  })
  unmatched_job_skills: string[];
}
