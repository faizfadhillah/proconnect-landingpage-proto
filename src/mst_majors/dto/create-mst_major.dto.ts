import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstMajorDto {
  @ApiProperty({
    type: String,
    description: "The name of the major",
    example: "Computer Science",
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  major_name: string;
}