import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../base.entity";

@Entity("mst_tags")
export class MstTag extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  tag: string;

  @Column({ length: 50 })
  type: string;
}
