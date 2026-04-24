import {
  IsUUID,
  IsString,
  IsEnum,
  Length,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { StatusSkillPassport } from "../entities/user_skill_passport.entity";

export class CreateUserSkillPassportDto {
  @ApiProperty({
    type: String,
    description: "The id of the user who owns the SkillPassport",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: "The number of the license or SkillPassport",
    example: "202411092981928-19289982",
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  number: string;

  @ApiProperty({
    description: "The file that issued the SkillPassport",
    example: "http://file-id.pdf",
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  file_url: string;

  @ApiProperty({
    description: "Status od SkillPassport",
    example: "UNVERIFIED",
    required: false,
    enum: StatusSkillPassport,
  })
  @IsEnum(StatusSkillPassport)
  status: StatusSkillPassport;
}
