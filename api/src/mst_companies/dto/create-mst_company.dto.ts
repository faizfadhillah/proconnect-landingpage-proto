// src/mst-companies/dto/create-mst-company.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Validate,
  Length,
  IsArray,
  ValidateIf,
} from "class-validator";
import { CompanyStatus } from "../entities/mst_company.entity";
import { IsUnique } from "src/app/validators/is-unique";

export class CreateMstCompanyDto {
  @ApiProperty({
    description: "Nama brand perusahaan",
    example: "Google Indonesia",
    maxLength: 255,
  })
  @IsString()
  @Length(3, 255)
  @ValidateIf((dto) => !dto.parent_id)
  brand_name!: string;

  @ApiProperty({
    description: "ID parent perusahaan",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @ValidateIf((dto) => dto.branch || dto.parent_id)
  parent_id: string;

  @ApiProperty({
    description: "Nama cabang perusahaan",
    example: "Jakarta Selatan",
    maxLength: 255,
  })
  @IsString()
  @ValidateIf((dto) => dto.branch || dto.parent_id)
  branch!: string;

  @ApiProperty({
    description: "Nama resmi perusahaan",
    example: "PT Google Indonesia Teknologi",
    maxLength: 255,
  })
  @IsString()
  @Length(3, 255)
  @ValidateIf((dto) => !dto.parent_id)
  company_name!: string;

  @ApiProperty({
    description: "Deskripsi perusahaan",
    example: "Perusahaan teknologi terkemuka di Indonesia",
  })
  @IsString()
  @ValidateIf((dto) => !dto.parent_id)
  company_description!: string;

  @ApiProperty({
    description: "Phone resmi perusahaan",
    example: "+6221-445599",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  phone: string;

  @ApiProperty({
    description: "Email resmi perusahaan",
    example: "info@company.com",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({
    type: String,
    description: "The photo profile URL",
    example: "http://image.png",
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  photo_url: string;

  @ApiProperty({
    description: "URL unik untuk profil perusahaan",
    example: "google-indonesia",
    maxLength: 255,
    uniqueItems: true,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  unique_url!: string;

  @ApiProperty({
    description: "Website resmi perusahaan",
    example: "https://www.google.co.id",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  website!: string;

  @ApiProperty({
    type: String,
    description: "UUID Industri perusahaan",
    example: "4b572578-934a-4c29-ad5f-647adbcef0c7",
  })
  @IsUUID()
  @IsOptional()
  industry_id: string;

  @ApiProperty({
    description: "Industri perusahaan",
    example: "Technology",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  industry!: string;

  @ApiProperty({
    description: "Ukuran organisasi",
    example: "Large Enterprise",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  organization_size!: string;

  @ApiProperty({
    description: "Tipe organisasi",
    example: "Private Company",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  organization_type!: string;

  @ApiProperty({
    description: "URL logo perusahaan",
    example: "https://storage.googleapis.com/company-logos/google.png",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  logo_url!: string;

  @ApiProperty({
    description: "Tagline atau slogan perusahaan",
    example:
      "Organize the world's information and make it universally accessible and useful",
  })
  @IsOptional()
  @IsString()
  tagline!: string;

  @ApiProperty({
    description: "Lokasi perusahaan",
    example: "Pacific Century Place, SCBD, Jakarta Selatan",
  })
  @IsOptional()
  @IsString()
  location!: string;

  @ApiProperty({
    description: "Bentuk badan hukum",
    example: "PT (Perseroan Terbatas)",
    maxLength: 124,
  })
  @IsOptional()
  @IsString()
  @Length(0, 124)
  legal_type!: string;

  @ApiProperty({
    description: "Jumlah karyawan",
    example: 1000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  number_of_employees!: number;

  @ApiProperty({
    description: "Nomor izin usaha",
    example: "NIB-0123456789",
    maxLength: 255,
  })
  @IsOptional()
  @Validate(IsUnique, ["mst_companies", "business_license"])
  @IsString()
  @Length(0, 255)
  business_license!: string;

  @ApiProperty({
    description: "Nomor Pokok Wajib Pajak (NPWP)",
    example: "01.234.567.8-901.000",
    maxLength: 255,
  })
  @IsOptional()
  @Validate(IsUnique, ["mst_companies", "tax_identification_number"])
  @IsString()
  @Length(0, 255)
  tax_identification_number!: string;

  @ApiProperty({
    description: "Nomor Pokok Wajib Pajak file url",
    example: "/xxx/xxx-npwp.jpg",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  tax_identification_url!: string;

  @ApiProperty({
    description: "ID region",
    example: "13.71",
    maxLength: 64,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  region_id?: string;

  @ApiProperty({
    description: "Region lain (opsional)",
    example: "Area SCBD",
    maxLength: 255,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  other_region?: string;

  @ApiProperty({
    description: "id from mst_salary_country",
    example: "58a8648a-b513-4fb6-a37c-73f46d87c838",
    maxLength: 64,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  country_id?: string;

  @ApiProperty({
    description: "country lain (opsional)",
    example: "Area SCBD",
    maxLength: 255,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  other_country?: string;

  @ApiProperty({
    description: "is outside indo",
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_outside_indo!: boolean;

  @ApiProperty({
    description: "Flag is same with hq",
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  use_hq_business_profile!: boolean;

  @ApiProperty({
    description: "Status verifikasi perusahaan",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified!: boolean;

  @ApiProperty({
    description: "Status premium perusahaan",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_premium!: boolean;

  @ApiProperty({
    description: "Status perusahaan",
    enum: CompanyStatus,
    example: CompanyStatus.ACTIVE,
    enumName: "CompanyStatus",
  })
  @IsOptional()
  @IsEnum(CompanyStatus)
  status!: CompanyStatus;

  @ApiProperty({
    description: "List of department IDs to assign to this company",
    example: ["03064b1d-cb84-4fb3-b9d8-ae46f69ee1c1"],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  department_ids?: string[];
}
