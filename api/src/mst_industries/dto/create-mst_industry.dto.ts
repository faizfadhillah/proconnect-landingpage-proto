import { IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstIndustryDto {
  @ApiProperty({
    type: String,
    description: "The name of the industry",
    example: "Minyak Gas Batu Bara",
  })
  @IsString()
  @Length(3, 255)
  name: string;
}
