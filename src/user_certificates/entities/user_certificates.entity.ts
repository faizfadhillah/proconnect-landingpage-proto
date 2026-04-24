// src\user_Certificates\entities\user_Certificate.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { User } from "src/users/entities/user.entity";
import { MstLicense } from "src/mst_licenses/entities/mst_license.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { ApprovalState } from "src/common/enums/approval-state.enum";

@Entity("user_certificates")
export class UserCertificate extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the user Certificate",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the user who owns this Certificate",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The number of the license or Certificate",
    example: "111-29128-192828",
    maxLength: 128,
    required: false,
  })
  @Column({ length: 128, nullable: true })
  license_number: string | null;

  @ApiProperty({
    description: "The name of the license or Certificate",
    example: "Certified Public Accountant",
    maxLength: 255,
  })
  @Column({ length: 255 })
  license_name: string;

  @ApiProperty({
    description: "The organization that issued the Certificate",
    example: "American Institute of CPAs",
    maxLength: 255,
  })
  @Column({ length: 255 })
  issuing_organization: string;

  @ApiProperty({
    description: "The date when the Certificate was issued",
    example: "2023-01-15",
  })
  @Type(() => Date)
  @Column({ type: "date" })
  issue_date: Date;

  @ApiProperty({
    description: "The level of the certificate",
    example: "Advanced",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  certificate_level: string | null;

  @ApiProperty({
    description: "Whether the Certificate has no expiry date",
    example: false,
  })
  @Column({ type: "boolean" })
  no_expiry: boolean;

  @ApiProperty({
    description: "The expiry date of the Certificate",
    example: "2028-01-15",
    required: false,
  })
  @Type(() => Date)
  @Column({ type: "date", nullable: true })
  expiry_date: Date;

  @ApiProperty({
    description: "Additional description or notes about the Certificate",
    example: "Specialized in corporate taxation",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  description: string;

  @ApiProperty({
    description: "The file url of license or Certificate",
    example: "/id-12312knjka12312knsadkd/asdasdasd.png",
    maxLength: 255,
  })
  @Column({ length: 255 })
  file_url: string;

  @ApiProperty({
    description: "Status verifikasi sertifikat",
    example: false,
    default: false,
  })
  @Column({ default: false })
  is_verified: boolean;

  @ApiProperty({
    description: "The approval state of the certificate",
    example: ApprovalState.WAITING_APPROVAL,
    enum: ApprovalState,
    default: ApprovalState.WAITING_APPROVAL,
  })
  @Column({
    type: "varchar",
    length: 20,
    default: ApprovalState.WAITING_APPROVAL,
  })
  approval_state: ApprovalState;

  @ApiProperty({
    description: "Who approved or rejected this certificate",
    example: "admin@example.com",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  approval_by: string | null;

  @ApiProperty({
    description: "The ID of the master license (optional)",
    example: "123e4567-e89b-12d3-a456-426614174002",
    required: false,
  })
  @Column({ type: "uuid", nullable: true })
  mst_license_id: string;

  @ApiProperty({
    description: "The ID of the user education that auto-created this certificate (optional, only populated for auto-created certificates)",
    example: "123e4567-e89b-12d3-a456-426614174003",
    required: false,
  })
  @Column({ type: "uuid", nullable: true })
  user_education_id: string | null;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstLicense, (model) => model.id)
  @JoinColumn({ name: "mst_license_id" })
  mst_license: MstLicense;

  @ManyToOne(() => UserEducation, (model) => model.id)
  @JoinColumn({ name: "user_education_id" })
  user_education: UserEducation;
}
