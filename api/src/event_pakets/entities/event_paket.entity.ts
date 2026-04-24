import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { Event } from "src/events/entities/event.entity";
import { ColumnNumericTransformer } from "src/app/validators/column-numeric-transformer";

@Entity("event_pakets")
export class EventPaket extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  event_id: string;

  @Column({ length: 255 })
  name: string;

  @Column("text")
  description: string;

  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  price: number;

  @Column("boolean")
  is_premium: boolean;

  @ManyToOne(() => Event, (model) => model.id)
  @JoinColumn({ name: "event_id" })
  event: Event;
}
