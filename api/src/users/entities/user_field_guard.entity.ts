import { BaseEntity } from "../../base.entity";
import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "./user.entity";
import { UserFieldGuardType } from "../enums/user-field-guard-type.enum";

@Entity("user_field_guards")
@Unique(["user_id", "type"])
export class UserFieldGuard extends BaseEntity {
  @ApiProperty({ description: "User ID" })
  @Column("uuid")
  user_id: string;

  @ApiProperty({ enum: UserFieldGuardType, description: "Field type (email or phone)" })
  @Column({ type: "varchar", length: 20 })
  type: UserFieldGuardType;

  @ApiProperty({ description: "Identifier value for audit (e.g. new email/phone)", nullable: true })
  @Column({ type: "varchar", length: 512, nullable: true })
  identifier: string | null;

  @ApiProperty({ description: "Guard valid until this date (after this, change is allowed)" })
  @Column({ type: "timestamptz" })
  guarded_until: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}
