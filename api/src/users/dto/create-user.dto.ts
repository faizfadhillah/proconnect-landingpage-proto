import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  IsOptional,
  Validate,
  Length,
} from "class-validator";
import { IsUnique } from "src/app/validators/is-unique";

export class CreateUserDto {
  @ApiProperty({
    type: String,
    example: "mXM8iPgjXSPno1D0f7oVO5csZao1",
  })
  @Validate(IsUnique, ["users", "firebase_uid"])
  @IsString()
  @Length(3, 255)
  firebase_uid?: string;

  @ApiProperty({
    type: String,
    example: "user@example.com",
  })
  @Validate(IsUnique, ["users", "email"])
  @IsEmail()
  @Length(3, 255)
  email: string;

  @ApiProperty({
    type: String,
    example: "+6282288456789",
  })
  @IsString()
  @IsOptional()
  @Length(8, 64)
  phone: string;

  @ApiProperty({
    type: String,
    example: "http://image.jpg",
  })
  @IsOptional()
  @IsString()
  @Length(0, 3000)
  photo_url: string;

  @ApiProperty({
    type: String,
    example: "129239",
  })
  @IsOptional()
  @IsString()
  otp: string;
}
