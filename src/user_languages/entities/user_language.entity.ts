// src\user_skills\entities\user_skill.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";
import { MstLanguage } from "src/mst_languages/entities/mst_language.entity";

@Entity("user_languages")
export class UserLanguage extends BaseEntity {
  @ApiProperty({
    description: "The ID of the user",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The ID of the language",
    example: "en",
  })
  @Column({})
  language_id: string;

  @ApiProperty({
    description: "The Name of the language",
    example: "English",
  })
  @Column({ length: 255 })
  language_name: string;

  @ApiProperty({
    description: "The proficiency level of the language",
    example: "Native/Bilingual",
  })
  @Column({ length: 255 })
  proficiency: string;

  @ApiProperty({
    description: "The variants of the language",
    example: '["US English"]',
  })
  @Column({ type: "jsonb" })
  variants: any;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstLanguage, (model) => model.id)
  @JoinColumn({ name: "language_id" })
  language: MstLanguage;
}
