import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("mst_licenses")
@Index(["license_template_code"], {
  unique: true,
  where: '"license_template_code" IS NOT NULL AND "deleted_at" IS NULL',
})
export class MstLicense extends BaseEntity {
  @ApiProperty({
    description: "The template code for the license (identifier/metadata)",
    example: "CPA-TEMPLATE-001",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  license_template_code: string;

  @ApiProperty({
    description: "The name of the license",
    example: "Certified Public Accountant",
    maxLength: 255,
  })
  @Column({ length: 255 })
  license_name: string;

  @ApiProperty({
    description: "The organization that issued the license",
    example: "American Institute of CPAs",
    maxLength: 255,
  })
  @Column({ length: 255 })
  issuing_organization: string;

  /*@ApiProperty({
    description: "The date when the license was issued",
    example: "2023-01-15",
  })
  @Column({ type: "date" })
  issue_date: Date;*/

  @ApiProperty({
    description: "The location where the test was taken",
    example: "Jakarta Testing Center",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  test_location: string;

  @ApiProperty({
    description: "The name of the assessor",
    example: "Dr. John Smith",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  assessor: string;

  @ApiProperty({
    description: "The level of the certificate",
    example: "Advanced",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  certificate_level: string;

  @ApiProperty({
    description: "The standard name",
    example: "ISO 9001:2015",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  standard_name: string;
}
