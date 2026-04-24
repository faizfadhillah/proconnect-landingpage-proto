// src\mst_skills\entities\mst_skill.entity.ts
import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("mst_salary_country")
export class MstSalaryCountry extends BaseEntity {
  @ApiProperty({
    description: "The name of the salary country",
    example: "Indonesia",
    maxLength: 100,
  })
  @Column({ length: 100 })
  country_name: string;

  @ApiProperty({
    description: "The code of the curency",
    example: "IDR",
    maxLength: 10,
  })
  @Column({ length: 10 })
  currency_code: string;

  @ApiProperty({
    description: "The symbol of the currency",
    example: "Rp",
    maxLength: 100,
  })
  @Column({ length: 100 })
  currency_symbol: string;

  @ApiProperty({
    description: "The status of the salary country",
    example: true,
  })
  @Column({ type: "boolean", default: true })
  is_salary_active: boolean;
}
