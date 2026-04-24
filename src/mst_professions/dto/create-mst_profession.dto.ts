import {
  IsUUID,
  IsInt,
  IsString,
  IsOptional,
  Validate,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsForeignKey } from "src/app/validators/is-foreign-key";

export class CreateMstProfessionDto {
  @ApiProperty({
    type: String,
    description: "The id of the parent profession (optional)",
    example: "12345678-1234-1234-1234-1234567890ab",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @Validate(IsForeignKey, ["mst_professions", "id"])
  parent_id?: string;

  @ApiProperty({
    type: Number,
    description: "The level of the profession",
    example: 1,
  })
  @IsInt()
  level: number;

  @ApiProperty({
    type: String,
    description: "The name of the profession",
    example: "Software Engineer",
  })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    type: String,
    description: "The tag of the profession",
    example: "Software",
  })
  @IsString()
  @Length(3, 255)
  tags: string;
}
