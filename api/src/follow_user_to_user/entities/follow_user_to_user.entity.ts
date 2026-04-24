import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { User } from "src/users/entities/user.entity";

export enum FollowStatusEnum {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

@Entity("follow_user_to_user")
export class FollowUserToUser extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  user_id: string;

  @Column("uuid")
  following_id: string;

  @Column({
    type: "enum",
    enum: FollowStatusEnum,
    default: FollowStatusEnum.PENDING,
  })
  status: FollowStatusEnum;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "following_id" })
  following: User;
}
