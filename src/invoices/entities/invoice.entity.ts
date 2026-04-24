import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { User } from "src/users/entities/user.entity";
import { MstSubscription } from "src/mst_subscription/entities/mst_subscription.entity";
import { ColumnNumericTransformer } from "src/app/validators/column-numeric-transformer";

export enum InvoiceStatus {
  PAID = "paid",
  PENDING = "pending",
  OVERDUE = "overdue",
}

@Entity("invoices")
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  user_id: string;

  @Column({ name: "invoice_number", length: 50 })
  invoice_number: string;

  @Column({ name: "payment_method", length: 50 })
  payment_method: string;

  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  amount: number;

  @Column({
    type: "enum",
    enum: InvoiceStatus,
  })
  status: InvoiceStatus;

  @Column({ name: "subscription_id", type: "uuid" })
  subscription_id: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstSubscription, (model) => model.id)
  @JoinColumn({ name: "subcription_id" })
  subcription: MstSubscription;
}
