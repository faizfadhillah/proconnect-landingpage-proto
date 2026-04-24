import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { User } from "src/users/entities/user.entity";

export enum FeedbackStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum FeedbackType {
  REQUEST = "REQUEST",
  GENERAL = "GENERAL",
  SUGGESTION = "SUGGESTION",
  ISSUE = "ISSUE",
  REQUEST_DELETION = "REQUEST_DELETION",
}

@Entity("feedbacks")
export class Feedback extends BaseEntity {
  @Column({
    type: "varchar",
    length: 64,
  })
  code: string;

  @Column({
    type: "enum",
    enum: FeedbackType,
  })
  type: FeedbackType;

  @Column("uuid")
  user_id: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  email: string;

  @Column("text")
  description: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  attachment_url: string;

  @Column({
    type: "enum",
    enum: FeedbackStatus,
  })
  status: FeedbackStatus;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
