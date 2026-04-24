import {
  Entity,
  Column,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("mst_majors")
export class MstMajor extends BaseEntity {
  @ApiProperty({
    description: "The name of the major",
    example: "Computer Science",
    maxLength: 255,
  })
  @Column({ length: 255, unique: true })
  major_name: string;
}