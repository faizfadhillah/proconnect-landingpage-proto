import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstSkillDto {
  @ApiProperty({
    type: String,
    description: "The name of the skill",
    example: "JavaScript",
  })
  @IsString()
  @Length(3, 255)
  name: string;
}
