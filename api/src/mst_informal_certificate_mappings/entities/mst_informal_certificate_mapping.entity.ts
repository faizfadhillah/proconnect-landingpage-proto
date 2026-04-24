import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstLicense } from "../../mst_licenses/entities/mst_license.entity";
import { InformalCertificateMappingStatus } from "../enums/informal-certificate-mapping-status.enum";

@Entity("mst_informal_certificate_mappings")
@Index(["email"])
@Index(["phone"])
@Index(["status"])
@Index(["license_id"])
export class MstInformalCertificateMapping extends BaseEntity {
  @ApiProperty({
    description: "User email",
    example: "user@example.com",
    nullable: true,
  })
  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;

  @ApiProperty({
    description: "User phone number",
    example: "+6281234567890",
    nullable: true,
  })
  @Column({ type: "varchar", length: 50, nullable: true })
  phone: string | null;

  @ApiProperty({
    description: "Name for reference/display",
    example: "John Doe",
  })
  @Column({ type: "varchar", length: 255 })
  name: string;

  @ApiProperty({
    description: "Photo URL for reference/display",
    example: "https://example.com/photo.jpg",
    nullable: true,
  })
  @Column({ type: "varchar", length: 500, nullable: true })
  photo_url: string | null;

  @ApiProperty({
    description: "License ID to be granted",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column({ type: "uuid" })
  license_id: string;

  @ApiProperty({
    description: "Processing status",
    enum: InformalCertificateMappingStatus,
    default: InformalCertificateMappingStatus.UNPROCESSED,
  })
  @Column({
    type: "varchar",
    length: 20,
    default: InformalCertificateMappingStatus.UNPROCESSED,
  })
  status: InformalCertificateMappingStatus;

  // Relationships
  @ManyToOne(() => MstLicense)
  @JoinColumn({ name: "license_id" })
  license: MstLicense;
}

