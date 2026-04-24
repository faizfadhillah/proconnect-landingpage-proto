import { IsArray, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserLanguageDto {
  @ApiProperty({
    type: String,
    description: "The id of the user",
    example: "863170ff-7a30-48e5-a6e8-155f8c4b934b",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: "The ID of the language",
    example: "en",
  })
  @IsString()
  @Length(1, 16)
  language_id: string;

  @ApiProperty({
    description: "The Name of the language",
    example: "English",
  })
  @IsString()
  @Length(3, 255)
  language_name: string;

  @ApiProperty({
    description: "The proficiency level of the language",
    example: "Native/Bilingual",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  proficiency: string;

  @ApiProperty({
    description: "The variants of the language",
    example: '["US English"]',
  })
  @IsOptional()
  @IsArray()
  variants: any;
}
