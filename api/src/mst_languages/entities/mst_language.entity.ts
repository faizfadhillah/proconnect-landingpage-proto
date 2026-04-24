// src\mst_skills\entities\mst_skill.entity.ts
import { Entity, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("mst_languages")
export class MstLanguage extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of language",
    example: "en",
  })
  @PrimaryColumn({ length: 16 })
  id: string;

  @ApiProperty({
    description: "The name of the language",
    example: "English",
    maxLength: 255,
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: "The variant of languages",
    example: '["US English","British English","Australian English"]',
  })
  @Column({ type: "jsonb" })
  variants: any;

  @ApiProperty({
    description: "The proficiency level of language",
    example:
      '["Elementary","Limited Working","Professional Working","Full Professional","Native/Bilingual"]',
  })
  @Column({ type: "jsonb" })
  proficiency: any;
}
