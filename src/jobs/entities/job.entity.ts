// src\jobs\entities\job.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ColumnNumericTransformer } from "src/app/validators/column-numeric-transformer";
import { MstSalaryCountry } from "src/mst_salary_country/entities/mst_salary_country.entity";
import { Applicant } from "../../applicants/entities/applicant.entity";

export enum JobStatus {
  DRAFT = "DRAFT",
  PUBLISH = "PUBLISH",
  CLOSE = "CLOSE",
}

@Entity("jobs")
export class Job extends BaseEntity {
  @Column("uuid")
  company_id: string;

  @Column({ length: 255 })
  title: string;

  @Column("text")
  description: string;

  @Column({ type: "enum", enum: JobStatus })
  status: JobStatus;

  @Column("uuid")
  region_id: string;

  @ApiProperty({
    type: Boolean,
    description: "is outside indo",
    example: false,
  })
  @Column({ default: false })
  is_outside_indo: boolean;

  @ApiProperty({
    type: String,
    description: "The other country out of indonesia",
    example: "US",
    nullable: true,
  })
  @Column({ length: 128, nullable: true })
  other_country: string | null;

  @ApiProperty({
    type: String,
    description: "The other region out of indonesia",
    example: "California",
    nullable: true,
  })
  @Column({ length: 512, nullable: true })
  other_region: string | null;

  @ApiProperty({
    type: String,
    description: "The salary pay interval",
    example: "monthly",
    nullable: true,
  })
  @Column({ length: 64, nullable: true })
  salary_pay_interval: string | null;

  @ApiProperty({
    type: String,
    description: "The salary country id",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @Column("uuid")
  salary_country_id: string;

  @ApiProperty({
    type: String,
    description: "The min of the SalaryCountry",
    example: "100000",
  })
  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  min_salary: number;

  @ApiProperty({
    type: String,
    description: "The max of the SalaryCountry",
    example: "150000",
  })
  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  max_salary: number;

  @ApiProperty({
    type: Array,
    description: "The employment status",
    example: ["full-time"],
  })
  @Column("jsonb")
  employment_status: any | string[];

  @ApiProperty({
    type: Array,
    description: "The domicile status",
    example: ["on-site", "remote"],
  })
  @Column("jsonb")
  domicile_status: any | string[];

  @ApiProperty({
    type: Array,
    description: "The multi interest id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @Column("jsonb")
  interest_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The multi right_to_work id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @Column("jsonb")
  skill_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The multi profession id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @Column("jsonb")
  profession_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The multi right_to_work id includes",
    example: [
      "12345678-1234-1234-1234-1234567890ab",
      "12345678-1234-1234-1234-1234567890ab",
    ],
  })
  @Column("jsonb")
  right_to_work_ids: string[];

  @ApiProperty({
    type: Array,
    description: "The mastered languages",
    example: ["en", "id"],
  })
  @Column("jsonb")
  language_ids: string[];

  @Column("jsonb")
  config: Record<string, any>;

  @ApiProperty({
    type: String,
    format: "date-time",
    description: "Date when the job is automatically published (optional). Stored as UTC datetime (ISO with Z). DB: timestamptz. API response may expose as date-only YYYY-MM-DD in GMT+7.",
    example: "2025-02-28T17:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamptz", nullable: true })
  open_date: Date | null;

  @ApiProperty({
    type: String,
    format: "date-time",
    description: "Date when the job is automatically closed (optional). Stored as UTC datetime (ISO with Z). DB: timestamptz. API response may expose as date-only YYYY-MM-DD in GMT+7.",
    example: "2025-06-29T17:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamptz", nullable: true })
  close_date: Date | null;

  @ApiProperty({
    type: String,
    description: "The slug for public job URL",
    example: "cook-restaurant-nusantara-group-20260101-1",
    nullable: true,
  })
  @Column({ length: 512, nullable: true, unique: true })
  slug: string | null;

  @ManyToOne(() => MstCompany, (model) => model.id)
  @JoinColumn({ name: "company_id" })
  company: MstCompany;

  @ManyToOne(() => MstRegion, (model) => model.id)
  @JoinColumn({ name: "region_id" })
  region: MstRegion;

  @OneToMany(() => Applicant, (model) => model.job)
  @ApiProperty({ type: () => Applicant, isArray: true })
  applicants: Applicant[];

  @ManyToOne(() => MstSalaryCountry, (model) => model.id)
  @JoinColumn({ name: "salary_country_id" })
  salary_country: MstSalaryCountry;
}
