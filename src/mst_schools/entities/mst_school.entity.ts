// src\mst_educations\entities\mst_education.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";

@Entity("mst_schools")
export class MstSchool extends BaseEntity {
  @ApiProperty({
    description: "The name of school",
    example: "Universitas Indonesia",
    maxLength: 255,
  })
  @Column({ length: 255, nullable: true })
  name: string;

  @ApiProperty({
    description: "ID region",
    example: "13.71",
  })
  @Column({ nullable: true })
  region_id!: string;

  @ApiProperty({
    description: "Address Detail",
    type: String,
  })
  @Column({ length: 512, nullable: true })
  address: string;

  @ApiProperty({
    type: Boolean,
    description: "is school verified",
    example: false,
  })
  @Column({ default: false })
  is_verified: boolean;

  @ManyToOne(() => MstRegion, (model) => model.id)
  @JoinColumn({ name: "region_id" })
  region: MstRegion;
}
