import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstInterestDto {
  @ApiProperty({
    type: String,
    description: "The name of the skill",
    example: "JavaScript",
  })
  @IsString()
  @Length(3, 255)
  name: string;
}
