import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ApprovalState } from "../../common/enums/approval-state.enum";
import { UserCertificate } from "../../user_certificates/entities/user_certificates.entity";
import { MstLicense } from "../../mst_licenses/entities/mst_license.entity";

export class StudentLicenseResponseDto {
  @ApiProperty({
    description: "The unique identifier of the certificate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "The number of the license or Certificate",
    example: "111-29128-192828",
    maxLength: 128,
    required: false,
    nullable: true,
  })
  license_number?: string | null;

  @ApiProperty({
    description: "The name of the license or Certificate",
    example: "Certified Public Accountant",
    maxLength: 255,
  })
  license_name: string;

  @ApiProperty({
    description: "The organization that issued the Certificate",
    example: "American Institute of CPAs",
    maxLength: 255,
  })
  issuing_organization: string;

  @ApiProperty({
    description: "The date when the Certificate was issued",
    example: "2023-01-15",
    required: false,
    nullable: true,
  })
  @Type(() => Date)
  issue_date?: Date | null;

  @ApiProperty({
    description: "Whether the Certificate has no expiry date",
    example: false,
  })
  no_expiry: boolean;

  @ApiProperty({
    description: "The expiry date of the Certificate",
    example: "2028-01-15",
    required: false,
    nullable: true,
  })
  @Type(() => Date)
  expiry_date?: Date | null;

  @ApiProperty({
    description: "Additional description or notes about the Certificate",
    example: "Specialized in corporate taxation",
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: "The file url of license or Certificate",
    example: "/id-12312knjka12312knsadkd/asdasdasd.png",
    maxLength: 255,
    required: false,
  })
  file_url?: string;

  @ApiProperty({
    description: "Status verifikasi sertifikat",
    example: false,
    default: false,
  })
  is_verified: boolean;

  @ApiProperty({
    description: "The approval state of the certificate",
    example: ApprovalState.WAITING_APPROVAL,
    enum: ApprovalState,
  })
  approval_state: ApprovalState;

  @ApiProperty({
    description: "Who approved or rejected this certificate",
    example: "admin@example.com",
    maxLength: 255,
    required: false,
    nullable: true,
  })
  approval_by?: string | null;

  @ApiProperty({
    description: "The ID of the master license (optional)",
    example: "123e4567-e89b-12d3-a456-426614174002",
    required: false,
    nullable: true,
  })
  mst_license_id?: string | null;

  @ApiProperty({
    description: "List of skill names associated with this license",
    example: ["Accounting", "Financial Analysis", "Tax Planning"],
    type: [String],
  })
  skills: string[];

  /**
   * Create DTO from UserCertificate entity with skills
   * @param certificate UserCertificate entity
   * @param skills Array of skill names associated with the license
   * @returns StudentLicenseResponseDto instance
   */
  static fromCertificate(
    certificate: UserCertificate,
    skills: string[] = [],
  ): StudentLicenseResponseDto {
    return {
      id: certificate.id,
      license_number: certificate.license_number || null,
      license_name: certificate.license_name,
      issuing_organization: certificate.issuing_organization,
      issue_date: certificate.issue_date || null,
      no_expiry: certificate.no_expiry,
      expiry_date: certificate.expiry_date || null,
      description: certificate.description || null,
      file_url: certificate.file_url || undefined,
      is_verified: certificate.is_verified,
      approval_state: certificate.approval_state,
      approval_by: certificate.approval_by || null,
      mst_license_id: certificate.mst_license_id || null,
      skills,
    };
  }

  /**
   * Create DTO from MstLicense entity (template) with skills
   * Used for NOT_JOINED students who don't have actual certificates yet
   * @param license MstLicense entity
   * @param skills Array of skill names associated with the license
   * @returns StudentLicenseResponseDto instance
   */
  static fromLicenseTemplate(
    license: MstLicense,
    skills: string[] = [],
  ): StudentLicenseResponseDto {
    return {
      id: license.id,
      license_number: null, // Not applicable for template
      license_name: license.license_name,
      issuing_organization: license.issuing_organization,
      //issue_date: license.issue_date || null,
      no_expiry: true, // Master licenses typically don't have expiry
      expiry_date: null, // Not applicable for template
      description: null, // Not applicable for template
      file_url: undefined, // Not applicable for template
      is_verified: false, // Not verified for pending students
      approval_state: ApprovalState.WAITING_APPROVAL, // Default state for template licenses
      approval_by: null,
      mst_license_id: license.id,
      skills,
    };
  }
}
