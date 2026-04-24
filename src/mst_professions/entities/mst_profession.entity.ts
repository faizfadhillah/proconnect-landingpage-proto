// src\mst_professions\entities\mst_profession.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("mst_professions")
export class MstProfession extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the profession",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the parent profession",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid", { nullable: true })
  parent_id: string;

  @ApiProperty({
    description: "The level of the profession",
    example: 1,
  })
  @Column("int")
  level: number;

  @ApiProperty({
    description: "The name of the profession",
    example: "Software Engineer",
    maxLength: 255,
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: "The tags of the profession",
    example: "technology, science",
    maxLength: 255,
  })
  @Column({ length: 255 })
  tags: string;

  @ManyToOne(() => MstProfession, (profession) => profession.id)
  @JoinColumn({ name: "parent_id" })
  parent: MstProfession;
}
