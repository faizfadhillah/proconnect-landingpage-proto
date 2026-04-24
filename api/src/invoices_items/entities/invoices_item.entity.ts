import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { Invoice } from "src/invoices/entities/invoice.entity";
import { EventPaket } from "src/event_pakets/entities/event_paket.entity";
import { ColumnNumericTransformer } from "src/app/validators/column-numeric-transformer";

export enum InvoiceItemStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELED = "canceled",
}

@Entity("invoices_items")
export class InvoicesItem extends BaseEntity {
  @Column("uuid")
  invoice_id: string;

  @Column("uuid")
  paket_id: string;

  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  price: number;

  @Column("int")
  qty: number;

  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  amount: number;

  @Column({
    type: "enum",
    enum: InvoiceItemStatus,
  })
  status: InvoiceItemStatus;

  @ManyToOne(() => Invoice, (model) => model.id)
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @ManyToOne(() => EventPaket, (model) => model.id)
  @JoinColumn({ name: "paket_id" })
  paket: EventPaket;
}
