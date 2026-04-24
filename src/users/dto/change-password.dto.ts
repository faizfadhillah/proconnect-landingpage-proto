import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    type: String,
    example: "old_password??!!",
  })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({
    type: String,
    example: "new_password??!!",
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
