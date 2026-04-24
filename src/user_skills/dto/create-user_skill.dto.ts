import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserSkillDto {
  @ApiProperty({
    type: String,
    description: "The id of the user",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the skill",
    example: "87654321-4321-4321-4321-ba0987654321",
  })
  @IsUUID()
  skill_id: string;
}
