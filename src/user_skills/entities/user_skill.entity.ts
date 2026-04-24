// src\user_skills\entities\user_skill.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstSkill } from "src/mst_skills/entities/mst_skill.entity";
import { User } from "src/users/entities/user.entity";
import { ApprovalState } from "src/common/enums/approval-state.enum";

@Entity("user_skills")
export class UserSkill extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the user skill",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the user",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The ID of the skill",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  skill_id: string;

  @ApiProperty({
    description: "Status verifikasi skill",
    example: false,
    default: false,
  })
  @Column({ default: false })
  is_verified: boolean;

  @ApiProperty({
    description: "The approval state of the skill",
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
    description: "Who approved or rejected this skill",
    example: "admin@example.com",
    maxLength: 255,
    required: false,
  })
  @Column({ length: 255, nullable: true })
  approval_by: string | null;

  @ManyToOne(() => MstSkill, (model) => model.id)
  @JoinColumn({ name: "skill_id" })
  skill: MstSkill;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
