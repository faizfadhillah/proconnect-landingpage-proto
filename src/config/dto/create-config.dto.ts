import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  Length,
} from "class-validator";

export class CreateConfigDto {
  @ApiProperty({
    type: String,
    example: "languages",
  })
  @Length(3, 255)
  key!: string;

  @ApiProperty({
    type: String,
    example: "list of languages",
  })
  @IsString()
  @Length(3, 3000)
  description!: string;

  @ApiProperty({
    type: "jsonb",
    example: [
      {
        id: 1,
        name: "English",
        code: "en",
      },
      {
        id: 2,
        name: "Indonesian",
        code: "id",
      },
    ],
  })
  value!: any;
}
