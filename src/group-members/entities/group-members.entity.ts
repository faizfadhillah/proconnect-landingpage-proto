import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { Groups } from "src/groups/entities/groups.entity";
import { User } from "src/users/entities/user.entity";

@Entity("group_members")
export class GroupMembers extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  group_id: string;

  @Column("uuid")
  user_id: string;

  @Column("varchar", { length: 50 })
  role: string;

  @Column("timestamp")
  joined_at: Date;

  @ManyToOne(() => Groups, (model) => model.id)
  @JoinColumn({ name: "group_id" })
  group: Groups;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
