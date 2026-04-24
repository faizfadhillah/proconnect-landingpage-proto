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

export enum PostType {
  PUBLIC = "public",
  PRIVATE = "private",
}

@Entity("posts")
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  user_id: string;

  @Column("uuid")
  company_id: string;

  @Column("text")
  content: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  post_type: PostType;

  @Column({
    type: "varchar",
    length: 255,
  })
  tags: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstCompany, (model) => model.id)
  @JoinColumn({ name: "company_id" })
  company: MstCompany;
}
