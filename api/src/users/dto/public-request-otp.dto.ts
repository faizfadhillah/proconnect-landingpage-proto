import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  Length,
} from "class-validator";

export class PublicRequestOtpDto {
  @ApiProperty({
    type: String,
  })
  @Length(3, 16)
  @IsString()
  email: string;
}
