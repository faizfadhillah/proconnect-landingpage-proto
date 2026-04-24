import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";

@Entity("mst_school_majors")
@Unique(["school_id", "major_id"])
export class MstSchoolMajor extends BaseEntity {
  @ApiProperty({
    description: "The ID of the school",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Column("uuid")
  school_id: string;

  @ApiProperty({
    description: "The ID of the major",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  major_id: string;

  @ManyToOne(() => MstSchool, (model) => model.id)
  @JoinColumn({ name: "school_id" })
  school: MstSchool;

  @ManyToOne(() => MstMajor, (model) => model.id)
  @JoinColumn({ name: "major_id" })
  major: MstMajor;
}

