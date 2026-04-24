import { IsOptional, IsString, Length, IsDate } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateMstLicenseDto {
  @ApiProperty({
    type: String,
    description: "The template code for the license (identifier/metadata)",
    example: "CPA-TEMPLATE-001",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  license_template_code?: string;

  @ApiProperty({
    type: String,
    description: "The name of the license",
    example: "Certified Public Accountant",
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  license_name: string;

  @ApiProperty({
    type: String,
    description: "The organization that issued the license",
    example: "American Institute of CPAs",
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  issuing_organization: string;

  /*@ApiProperty({
    description: "The date when the license was issued",
    example: "2023-01-15",
  })
  @IsDate()
  @Type(() => Date)
  issue_date: Date;*/

  @ApiProperty({
    type: String,
    description: "The location where the test was taken",
    example: "Jakarta Testing Center",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  test_location: string;

  @ApiProperty({
    type: String,
    description: "The name of the assessor",
    example: "Dr. John Smith",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  assessor: string;

  @ApiProperty({
    type: String,
    description: "The level of the certificate",
    example: "Advanced",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  certificate_level: string;

  @ApiProperty({
    type: String,
    description: "The standard name",
    example: "ISO 9001:2015",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  standard_name: string;
}
