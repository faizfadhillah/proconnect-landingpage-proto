import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstSalaryCountry } from "src/mst_salary_country/entities/mst_salary_country.entity";

@Entity({ name: "mst_right_to_works" })
export class MstRightToWork extends BaseEntity {
  @ApiProperty({
    description: "The ID of the SalaryCountry",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  salary_country_id: string;

  @ApiProperty({
    type: String,
    example: "RTW-001",
  })
  @Column({ type: "varchar", length: 50 })
  code: string;

  @ApiProperty({
    type: String,
    example: "Kartu Izin Tinggal Terbatas (KITAS)",
  })
  @Column({ type: "varchar", length: 255 })
  name: string;

  @ApiProperty({
    type: String,
    example: "Description of right to work",
  })
  @Column("text")
  description: string;

  @ManyToOne(() => MstSalaryCountry, (model) => model.id)
  @JoinColumn({ name: "salary_country_id" })
  salary_country: MstSalaryCountry;
}
