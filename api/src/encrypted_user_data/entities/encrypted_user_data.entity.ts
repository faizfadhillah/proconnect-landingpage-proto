import { User } from "src/users/entities/user.entity";
import { BaseEntity } from "../../base.entity";
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity("encrypted_user_data")
export class EncryptedUserData extends BaseEntity {
  @Column("uuid")
  user_id!: string;

  @Column()
  encrypted_date_of_birth!: string;

  @Column()
  encrypted_nik!: string;

  @Column()
  encrypted_phone!: string;

  @Column()
  encrypted_address!: string;

  @Column()
  country_code!: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
