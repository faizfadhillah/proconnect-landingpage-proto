import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstSchool } from "../../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../../mst_majors/entities/mst_major.entity";
import { MstProfession } from "../../mst_professions/entities/mst_profession.entity";
import { User } from "../../users/entities/user.entity";

@Entity("mst_education_profession_mappings")
export class MstEducationProfessionMapping extends BaseEntity {
  @ApiProperty({
    description: "School ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column({ type: "uuid" })
  school_id: string;

  @ApiProperty({
    description: "Major ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column({ type: "uuid" })
  major_id: string;

  @ApiProperty({
    description: "Education Degree",
    example: "S1",
  })
  @Column({ type: "varchar", length: 32 })
  degree: string;

  @ApiProperty({
    description: "Diploma Level (e.g., L1, L2, L3). Null = wildcard (any level).",
    example: "L2",
    maxLength: 50,
    nullable: true,
  })
  @Column({ type: "varchar", length: 50, nullable: true })
  diploma_level: string | null;

  @ApiProperty({
    description: "Profession ID",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  @Column({ type: "uuid" })
  profession_id: string;

  @ManyToOne(() => MstSchool)
  @JoinColumn({ name: "school_id" })
  school: MstSchool;

  @ManyToOne(() => MstMajor)
  @JoinColumn({ name: "major_id" })
  major: MstMajor;

  @ManyToOne(() => MstProfession)
  @JoinColumn({ name: "profession_id" })
  profession: MstProfession;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;
}

