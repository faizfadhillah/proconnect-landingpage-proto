// src\user_educations\entities\user_education.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { User } from "src/users/entities/user.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";
import { ApprovalState } from "src/common/enums/approval-state.enum";

@Entity("user_educations")
export class UserEducation extends BaseEntity {
  @ApiProperty({
    description: "The ID of the user",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The ID of school_id is optional",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  school_id: string;

  @ApiProperty({
    description: "The name of education degree",
    example: "S1",
    maxLength: 32,
  })
  @Column({ length: 32 })
  education_degree: string;

  @ApiProperty({
    description: "The name of the institution",
    example: "Harvard University",
    maxLength: 255,
  })
  @Column({ length: 255 })
  institution_name: string;

  @ApiProperty({
    description: "The major of study",
    example: "Computer Science",
    maxLength: 255,
  })
  @Column({ length: 255 })
  major: string;

  @ApiProperty({
    description: "The ID of the major",
    example: "123e4567-e89b-12d3-a456-426614174003",
    nullable: true,
  })
  @Column({ type: "uuid", nullable: true })
  major_id: string | null;

  @ApiProperty({
    type: String,
    description: "The ID of the region the user belongs to",
    example: "13.71",
    nullable: true,
  })
  @Column({ nullable: true })
  region_id: string | null;

  @ManyToOne(() => MstRegion, { nullable: true })
  @JoinColumn({ name: "region_id" })
  region: MstRegion;

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
    description: "The start date of education",
    example: "2020-09-01",
  })
  @Type(() => Date)
  @Column({ type: "date" })
  start_date: Date;

  @ApiProperty({
    description: "The end date of education",
    example: "2024-06-30",
  })
  @Type(() => Date)
  @Column({ type: "date", nullable: true })
  end_date: Date;

  @ApiProperty({
    description: "Whether this is the current education",
    example: true,
  })
  @Column({ type: "boolean" })
  is_current: boolean;

  @ApiProperty({
    description: "The description",
    example: "anything lorem ipsum",
  })
  @Column({ type: "text" })
  description: string;

  @ApiProperty({
    description: "The file attachment url",
    example: "http://cdn.aseanta.com/file.pdf",
    maxLength: 255,
  })
  @Column({ length: 255 })
  file_url: string;

  @ApiProperty({
    description: "The student id of the education",
    example: "1312022008",
  })
  @Column({ length: 255 })
  student_id: string;

  @ApiProperty({
    description: "The certificate number of the education",
    example: "UI923892830-12981829",
  })
  @Column({ length: 255 })
  certificate_number: string;

  @ApiProperty({
    description: "The curriculum year of the education",
    example: "2020/2021",
  })
  @Column({ length: 255 })
  curriculum_year: string;

  @ApiProperty({
    description: "Status verifikasi education",
    example: false,
    default: false,
  })
  @Column({ default: false })
  is_verified: boolean;

  @ApiProperty({
    description: "The approval state of the education",
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
    description: "Who approved or rejected this education",
    example: "admin@example.com",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  approval_by: string | null;

  @ApiProperty({
    description: "The diploma level",
    example: "L4",
    maxLength: 50,
    required: false,
  })
  @Column({ length: 50, nullable: true })
  diploma_level: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstSchool, (model) => model.id)
  @JoinColumn({ name: "school_id" })
  school: MstSchool;

  @ManyToOne(() => MstMajor, { nullable: true })
  @JoinColumn({ name: "major_id" })
  majorEntity: MstMajor;
}
