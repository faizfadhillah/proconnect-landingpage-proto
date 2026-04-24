import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { BaseEntity } from "src/base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";

@Entity("pending_student_verifications")
@Unique(["student_id", "school_id", "major_id", "degree", "diploma_level"])
export class PendingStudentVerification extends BaseEntity {
  @ApiProperty({
    description: "Student identifier (unique per school)",
    example: "1312022008",
    maxLength: 255,
  })
  @Column({ length: 255 })
  student_id: string;

  @ApiProperty({
    description: "School ID (must not be null)",
    example: "c6e2fb7c-2e6c-4fb3-93bf-6c24d2dba1d2",
  })
  @Column({ type: "uuid" })
  school_id: string;

  @ApiProperty({
    description: "Full name (if provided at upload)",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  full_name?: string | null;

  @ApiProperty({
    description: "Photo URL (if provided at upload)",
    maxLength: 500,
    required: false,
  })
  @Column({ length: 500, nullable: true })
  photo_url?: string | null;

  @ApiProperty({
    description: "Email (if provided at upload)",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  email?: string | null;

  @ApiProperty({
    description: "Phone number (if provided at upload)",
    maxLength: 50,
    required: false,
  })
  @Column({ length: 50, nullable: true })
  phone_num?: string | null;

  @ApiProperty({
    description: "Major (optional)",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  major?: string | null;

  @ApiProperty({
    description: "Major ID (optional)",
    example: "c6e2fb7c-2e6c-4fb3-93bf-6c24d2dba1d2",
    required: false,
  })
  @Column({ type: "uuid", nullable: true })
  major_id?: string | null;

  @ApiProperty({
    description: "Education Degree",
    example: "S1",
  })
  @Column({ type: "varchar", length: 32 })
  degree: string;

  @ApiProperty({
    description: "Diploma Level (e.g., L1, L2, L3)",
    example: "L2",
    maxLength: 50,
    required: false,
  })
  @Column({ type: "varchar", length: 50, nullable: true })
  diploma_level?: string | null;

  @ManyToOne(() => MstSchool, (school) => school.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "school_id" })
  school: MstSchool;

  @ManyToOne(() => MstMajor, { nullable: true })
  @JoinColumn({ name: "major_id" })
  majorEntity?: MstMajor;
}

