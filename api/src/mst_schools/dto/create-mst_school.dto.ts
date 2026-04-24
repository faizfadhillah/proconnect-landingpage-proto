import { IsOptional, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstSchoolDto {
  @ApiProperty({
    type: String,
    description: "The name of school",
    example: "Universitas Indonesia",
    maxLength: 255,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "ID region",
    example: "13.71",
    maxLength: 64,
  })
  @IsString()
  @IsOptional()
  region_id!: string;

  @ApiProperty({
    description: "Address Detail",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  address: string;

  @ApiProperty({
    type: Boolean,
    description: "is school verified",
    example: false,
  })
  @IsOptional()
  is_verified: boolean;
}
