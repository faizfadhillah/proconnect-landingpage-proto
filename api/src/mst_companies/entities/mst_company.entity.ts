import { BaseEntity } from "../../base.entity";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";
import { MstIndustry } from "src/mst_industries/entities/mst_industry.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { MstCountry } from "src/mst_country/entities/mst_country.entity";

export enum CompanyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

@Entity("mst_companies")
export class MstCompany extends BaseEntity {
  @ApiProperty({
    description: "URL logo perusahaan",
    example: "https://storage.googleapis.com/company-logos/google.png",
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @Column({ type: "varchar", length: 255 })
  logo_url!: string;

  @ApiProperty({
    description: "Nama brand perusahaan",
    example: "Google Indonesia",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  brand_name!: string;

  @ApiProperty({
    description: "ID parent perusahaan",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @Column("uuid")
  parent_id: string;

  @ApiProperty({
    description: "Nama resmi perusahaan",
    example: "PT Google Indonesia Teknologi",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  company_name!: string;

  @ApiProperty({
    description: "Deskripsi perusahaan",
    example: "Perusahaan teknologi terkemuka di Indonesia",
  })
  @IsString()
  @Column({ type: "text" })
  company_description!: string;

  @ApiProperty({
    description: "Nama cabang perusahaan",
    example: "Jakarta Selatan",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  branch!: string;

  @ApiProperty({
    description: "Phone resmi perusahaan",
    example: "+6221-445599",
    maxLength: 255,
  })
  @Column({ type: "varchar", length: 255 })
  phone: string;

  @ApiProperty({
    description: "Email resmi perusahaan",
    example: "info@company.com",
    maxLength: 255,
  })
  @Column({ type: "varchar", length: 255 })
  email: string;

  @ApiProperty({
    description: "URL unik untuk profil perusahaan",
    example: "google-indonesia",
    maxLength: 255,
    uniqueItems: true,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  unique_url!: string;

  @ApiProperty({
    description: "Website resmi perusahaan",
    example: "https://www.google.co.id",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  website!: string;

  @ApiProperty({
    description: "Industri perusahaan",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @Column("uuid")
  industry_id: string;

  @ApiProperty({
    description: "Industri perusahaan",
    example: "Technology",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  industry!: string;

  @ApiProperty({
    description: "Ukuran organisasi",
    example: "Large Enterprise",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  organization_size!: string;

  @ApiProperty({
    description: "Tipe organisasi",
    example: "Private Company",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  organization_type!: string;

  @ApiProperty({
    description: "Tagline atau slogan perusahaan",
    example:
      "Organize the world's information and make it universally accessible and useful",
  })
  @IsString()
  @Column({ type: "text" })
  tagline!: string;

  @ApiProperty({
    type: String,
    description: "The photo profile URL",
    example: "http://image.png",
  })
  @Column({ type: "varchar", length: 255 })
  photo_url: string;

  @ApiProperty({
    description: "Lokasi perusahaan",
    example: "Pacific Century Place, SCBD, Jakarta Selatan",
  })
  @IsString()
  @Column({ type: "text" })
  location!: string;

  @ApiProperty({
    description: "Bentuk badan hukum",
    example: "PT (Perseroan Terbatas)",
    maxLength: 124,
  })
  @IsString()
  @Column({ type: "varchar", length: 124 })
  legal_type!: string;

  @ApiProperty({
    description: "Jumlah karyawan",
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Column({ type: "int" })
  number_of_employees!: number;

  @ApiProperty({
    description: "Nomor izin usaha",
    example: "NIB-0123456789",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  business_license!: string;

  @ApiProperty({
    description: "Nomor Pokok Wajib Pajak (NPWP)",
    example: "01.234.567.8-901.000",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  tax_identification_number!: string;

  @ApiProperty({
    description: "NPWP file url",
    example: "/xxx-npwp.jpg",
    maxLength: 255,
  })
  @IsString()
  @Column({ type: "varchar", length: 255 })
  tax_identification_url!: string;

  @ApiProperty({
    description: "ID region",
    example: "JKT-001",
    maxLength: 64,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Column({ type: "varchar", nullable: true })
  region_id?: string;

  @ManyToOne(() => MstRegion, (model) => model.id)
  @JoinColumn({ name: "region_id" })
  region: MstRegion;

  @ApiProperty({
    description: "Region lain (opsional)",
    example: "Area SCBD",
    maxLength: 255,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Column({ type: "varchar", length: 255, nullable: true })
  other_region?: string;

  @ApiProperty({
    description: "Status verifikasi perusahaan",
    example: false,
    default: false,
  })
  @IsBoolean()
  @Column({ default: false })
  is_verified!: boolean;

  @ApiProperty({
    description: "Status premium perusahaan",
    example: false,
    default: false,
  })
  @IsBoolean()
  @Column({ default: false })
  is_premium!: boolean;

  @ApiProperty({
    description: "Status perusahaan",
    enum: CompanyStatus,
    example: CompanyStatus.ACTIVE,
    enumName: "CompanyStatus",
  })
  @IsEnum(CompanyStatus)
  @Column({
    type: "enum",
    enum: CompanyStatus,
  })
  status!: CompanyStatus;

  @ManyToOne(() => MstIndustry, (model) => model.id)
  @JoinColumn({ name: "industry_id" })
  industri: MstIndustry;

  @ManyToOne(() => MstCompany, (model) => model.id)
  @JoinColumn({ name: "parent_id" })
  parent: MstCompany;

  @ApiProperty({
    description: "id from mst_salary_country",
    example: "58a8648a-b513-4fb6-a37c-73f46d87c838",
    maxLength: 64,
    required: false,
  })
  @IsString()
  @Column({ type: "uuid", nullable: true })
  country_id?: string;

  @ManyToOne(() => MstCountry, (model) => model.id)
  @JoinColumn({ name: "country_id" })
  country?: MstCountry;

  @ApiProperty({
    description: "Other Country",
    maxLength: 64,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Column({ type: "varchar", length: 64, nullable: true })
  other_country?: string;

  @ApiProperty({
    type: Boolean,
    description: "is outside indo",
    example: false,
  })
  @Column({ default: false })
  is_outside_indo: boolean;

  @ApiProperty({
    description: "Flag is business profile data, inherit from HQ",
    example: false,
    default: false,
  })
  @IsBoolean()
  @Column({ default: false })
  use_hq_business_profile!: boolean;

  public isHqCompany(): boolean {
    return this.parent_id === null;
  }
}
