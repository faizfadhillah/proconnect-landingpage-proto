import { BaseEntity } from "../../base.entity";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("user_otp")
export class UserOtp extends BaseEntity {
  @Column()
  user_id: string;

  @Column()
  email: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  otp: string;

  @Column()
  expiry_date: Date;
}
