import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { User } from "src/users/entities/user.entity";
import { MstSubscription } from "src/mst_subscription/entities/mst_subscription.entity";

@Entity("user_subscription")
export class UserSubscription extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  user_id: string;

  @Column("uuid")
  subscription_id: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstSubscription, (model) => model.id)
  @JoinColumn({ name: "subscription_id" })
  subscription: MstSubscription;
}
