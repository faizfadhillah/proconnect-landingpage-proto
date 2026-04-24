// src\user_SkillPassports\entities\user_SkillPassport.entity.ts
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";

export enum StatusSkillPassport {
  UNVERIFIED = "UNVERIFIED",
  PROCESS = "PROCESS",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

@Entity("user_skill_passports")
export class UserSkillPassport extends BaseEntity {
  @ApiProperty({
    description: "The ID of the user who owns this SkillPassport",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The number of the license or SkillPassport",
    example: "202411092981928-19289982",
    maxLength: 255,
  })
  @Column({ length: 255 })
  number: string;

  @ApiProperty({
    description: "The file that issued the SkillPassport",
    example: "http://file-id.pdf",
    maxLength: 255,
  })
  @Column({ length: 255 })
  file_url: string;

  @ApiProperty({
    description: "Status od SkillPassport",
    example: "UNVERIFIED",
    required: false,
    enum: StatusSkillPassport,
  })
  @Column({ type: "enum", enum: StatusSkillPassport })
  status: StatusSkillPassport;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
