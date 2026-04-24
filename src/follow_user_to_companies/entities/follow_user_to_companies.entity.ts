import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { User } from "src/users/entities/user.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";

export enum FollowStatusEnum {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

@Entity("follow_user_to_companies")
export class FollowUserToCompanies extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  user_id: string;

  @Column("uuid")
  company_id: string;

  @Column({
    type: "enum",
    enum: FollowStatusEnum,
    default: FollowStatusEnum.PENDING,
  })
  status: FollowStatusEnum;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstCompany, (model) => model.id)
  @JoinColumn({ name: "company_id" })
  company: MstCompany;
}
