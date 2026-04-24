import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional, IsEnum } from "class-validator";
import { UserGender } from "../entities/user.entity";

export class RegisterCandidateDto {
  @ApiProperty({
    type: String,
    example: "candidate@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    example: "John Doe",
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    example: "+6282288456789",
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    type: String,
    example: "male",
    enum: UserGender,
  })
  @IsEnum(UserGender)
  gender: UserGender;
}