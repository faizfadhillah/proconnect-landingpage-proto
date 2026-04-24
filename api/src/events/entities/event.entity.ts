import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../base.entity";

@Entity("events")
export class Event extends BaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column("text")
  description: string;

  @Column({ type: "timestamp" })
  event_date: Date;

  @Column({ length: 255 })
  tags: string;
}
