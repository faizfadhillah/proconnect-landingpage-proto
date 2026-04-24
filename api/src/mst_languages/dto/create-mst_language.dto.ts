import { IsArray, IsOptional, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstLanguageDto {
  @ApiProperty({
    type: String,
    description: "The unique identifier of language",
    example: "en",
  })
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: "The name of the language",
    example: "English",
    maxLength: 255,
  })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    description: "The variant of languages",
    example: '["US English","British English","Australian English"]',
  })
  @IsArray()
  @IsOptional()
  variants?: any;

  @ApiProperty({
    description: "The proficiency level of language",
    example:
      '["Elementary","Limited Working","Professional Working","Full Professional","Native/Bilingual"]',
  })
  @IsArray()
  @IsOptional()
  proficiency?: any;
}
