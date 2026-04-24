import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  Length,
} from "class-validator";

export class UserVerifyOtpDto {
  @ApiProperty({
    type: String,
  })
  @Length(3, 16)
  @IsString()
  otp_code: string;
}
