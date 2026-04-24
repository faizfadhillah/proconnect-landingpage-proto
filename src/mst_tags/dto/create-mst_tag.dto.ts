import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstTagDto {
  @ApiProperty({
    type: String,
    description: "The ty of tags e.g POST, EVENT, PROFESSION",
    example: "POST",
  })
  @IsString()
  @Length(3, 50)
  type: string;

  @ApiProperty({
    type: String,
    description: "The tag for the event",
    example: "Technology",
  })
  @IsString()
  @Length(3, 255)
  tag: string;
}
