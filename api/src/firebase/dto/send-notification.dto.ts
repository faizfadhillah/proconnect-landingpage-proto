import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  Length,
} from "class-validator";

export class SendNotificationDto {
  @ApiProperty({
    type: String,
  })
  @Length(3, 16)
  @IsString()
  title: string;

  @ApiProperty({
    type: String,
  })
  @Length(3, 16)
  @IsString()
  body: string;
}
