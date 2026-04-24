import { IsUUID, IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEncryptedUserDataDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: "The id of the user",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  user_id: string;

  @ApiProperty({
    description: "The plain date of birth",
    example: "2000-01-01",
  })
  @IsString()
  @IsOptional()
  encrypted_date_of_birth: string;

  @ApiProperty({
    description: "The plain of NIK",
    example: "166772817390300009",
  })
  @IsString()
  @IsOptional()
  encrypted_nik: string;

  @ApiProperty({
    description: "The plain text of phone",
    example: "0822198939283",
  })
  @IsString()
  @IsOptional()
  encrypted_phone: string;

  @ApiProperty({
    description: "The address",
    example: "Jl Indarung No 45",
  })
  @IsString()
  @IsOptional()
  encrypted_address: string;

  @ApiProperty({
    description: "The country code",
    example: "ID",
  })
  @IsString()
  @IsOptional()
  country_code: string;
}
