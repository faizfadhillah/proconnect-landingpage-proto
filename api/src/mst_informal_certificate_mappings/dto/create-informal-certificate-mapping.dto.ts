import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsEmail, IsString, Length, IsUUID } from "class-validator";

export class CreateInformalCertificateMappingDto {
  @ApiProperty({
    description: "User email",
    example: "user@example.com",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: "User phone number",
    example: "+6281234567890",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  phone?: string;

  @ApiProperty({
    description: "Name for reference/display",
    example: "John Doe",
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: "Photo URL for reference/display",
    example: "https://example.com/photo.jpg",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  photo_url?: string;

  @ApiProperty({
    description: "License ID to be granted",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID("4", { message: "License ID must be a valid UUID" })
  license_id: string;
}

