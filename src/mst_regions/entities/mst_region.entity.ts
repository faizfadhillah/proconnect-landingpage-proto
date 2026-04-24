import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity } from "../../base.entity";
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from "typeorm";

@Entity("mst_regions")
export class MstRegion extends BaseEntity {
  @ApiProperty({
    example: "13.71",
  })
  @PrimaryColumn()
  id!: string;

  @ApiProperty({
    example: "Kota Padang",
  })
  @Column()
  name!: string;

  @ApiProperty({
    example: "city",
  })
  @Column({ length: 50 })
  type!: string;

  @ApiProperty({
    example: "13",
  })
  @Column({ nullable: true })
  parent_id?: string;

  @ApiProperty({
    example: "Kota Padang, Sumatera Barat",
  })
  @Column()
  full_name!: string;

  @ManyToOne(() => MstRegion, { nullable: true })
  @JoinColumn({ name: "parent_id" })
  parent?: MstRegion;
}
