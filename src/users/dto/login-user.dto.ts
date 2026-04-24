import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsEmail,
  Length,
} from "class-validator";

export class LoginUserDto {
  @ApiProperty({
    type: String,
  })
  @IsEmail()
  @Length(3, 255)
  email: string;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @Length(3, 255)
  password: string;
}
