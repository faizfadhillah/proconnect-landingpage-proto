import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ColumnNumericTransformer } from "src/app/validators/column-numeric-transformer";

@Entity("mst_subscription")
export class MstSubscription extends BaseEntity {
  @Column({ length: 255 })
  name: string;

  @Column("text")
  description: string;

  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  price: number;

  @Column("int")
  duration: number;
}
