// src\user_Interests\entities\user_Interest.entity.ts
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
import { MstInterest } from "src/mst_interests/entities/mst_interest.entity";

@Entity("user_interests")
export class UserInterest extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the user Interest",
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
    description: "The ID of the Interest",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  interest_id: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstInterest, (model) => model.id)
  @JoinColumn({ name: "interest_id" })
  interest: MstInterest;
}
