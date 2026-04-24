import {
  IsUUID,
  IsString,
  IsDate,
  IsBoolean,
  IsOptional,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { UserCertificate } from "../entities/user_certificates.entity";
import { MstLicense } from "../../mst_licenses/entities/mst_license.entity";

export class CreateUserCertificateDto {
  @ApiProperty({
    type: String,
    description:
      "The id of the user who owns the Certificate. If not provided, will be automatically derived from the authentication token.",
    example: "12345678-1234-1234-1234-1234567890ab",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    type: String,
    description:
      "Optional. The ID of the master license template. If provided, license details will be automatically populated from mst_license.",
    example: "123e4567-e89b-12d3-a456-426614174002",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  mst_license_id?: string;

  @ApiProperty({
    type: String,
    description:
      "Optional. The ID of the user education that auto-created this certificate. Only populated for auto-created certificates, not manual candidate input.",
    example: "123e4567-e89b-12d3-a456-426614174003",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_education_id?: string;

  @ApiProperty({
    type: String,
    description:
      "The license number for this user's certificate (optional). This is the individual user's license number, not from the template.",
    example: "CPA-12345-2023",
    maxLength: 128,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 128)
  license_number?: string;

  @ApiProperty({
    type: String,
    description:
      "Optional. The name of the license. Required if mst_license_id is not provided.",
    example: "Certified Public Accountant",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  license_name?: string;

  @ApiProperty({
    type: String,
    description:
      "Optional. The organization that issued the license. Required if mst_license_id is not provided.",
    example: "American Institute of CPAs",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  issuing_organization?: string;

  @ApiProperty({
    type: Date,
    description:
      "Optional. The date when the license was issued. Required if mst_license_id is not provided.",
    example: "2023-01-15",
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  issue_date?: Date;

  @ApiProperty({
    type: String,
    description:
      "Optional. Certificate level. If not provided, will be populated from mst_license.",
    example: "Advanced",
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  certificate_level?: string;

  @ApiProperty({
    type: Boolean,
    description: "Whether the Certificate has no expiry date",
    example: false,
  })
  @IsBoolean()
  no_expiry: boolean;

  @ApiProperty({
    type: Date,
    description: "The expiry date of the Certificate",
    example: "2028-01-15",
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiry_date?: Date;

  @ApiProperty({
    type: String,
    description: "Additional description or notes about the Certificate",
    example: "Specialized in corporate taxation",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @ApiProperty({
    description: "The file url of license or Certificate",
    example: "/id-12312knjka12312knsadkd/asdasdasd.png",
    maxLength: 255,
  })
  @IsString()
  @Length(0, 255)
  @IsOptional()
  file_url: string;

  /**
   * Convert DTO to Entity
   */
  toEntity(mstLicense?: MstLicense | null): Partial<UserCertificate> {
    return {
      user_id: this.user_id!,
      mst_license_id: this.mst_license_id || null,
      user_education_id: this.user_education_id || null,
      license_number: this.license_number || "-",
      license_name: this.license_name || mstLicense?.license_name || null,
      issuing_organization:
        this.issuing_organization || mstLicense?.issuing_organization || null,
      issue_date: this.issue_date || null,
      certificate_level:
        this.certificate_level || mstLicense?.certificate_level || null,
      no_expiry: this.no_expiry,
      expiry_date: this.expiry_date || null,
      description: this.description || null,
      file_url: this.file_url || "",
    };
  }
}
