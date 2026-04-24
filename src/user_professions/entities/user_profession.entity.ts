// src\user_professions\entities\user_profession.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";

@Entity("user_professions")
export class UserProfession extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the user profession",
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
    description: "The ID of the profession",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  profession_id: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstProfession, (model) => model.id)
  @JoinColumn({ name: "profession_id" })
  profession: MstProfession;
}
