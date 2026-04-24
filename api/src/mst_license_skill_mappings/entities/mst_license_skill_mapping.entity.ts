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
import { MstSkill } from "../../mst_skills/entities/mst_skill.entity";

@Entity("mst_license_skill_mappings")
@Index(["license_id", "skill_id"], { unique: true, where: '"deleted_at" IS NULL' })
export class MstLicenseSkillMapping extends BaseEntity {
  @ApiProperty({
    description: "License ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column({ type: "uuid" })
  license_id: string;

  @ApiProperty({
    description: "Skill ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column({ type: "uuid" })
  skill_id: string;

  // Relationships
  @ManyToOne(() => MstLicense)
  @JoinColumn({ name: "license_id" })
  license: MstLicense;

  @ManyToOne(() => MstSkill)
  @JoinColumn({ name: "skill_id" })
  skill: MstSkill;
}

