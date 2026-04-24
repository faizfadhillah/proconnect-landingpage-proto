// src\user_SalaryCountrys\entities\user_SalaryCountry.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";
import { MstSalaryCountry } from "src/mst_salary_country/entities/mst_salary_country.entity";
import { ColumnNumericTransformer } from "src/app/validators/column-numeric-transformer";

@Entity("user_salary_country")
export class UserSalaryCountry extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the user SalaryCountry",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the user",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The salary pay interval",
    example: "monthly",
  })
  @Column({ length: 64, nullable: true })
  salary_pay_interval: string | null;

  @ApiProperty({
    description: "The ID of the SalaryCountry",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  salary_country_id: string;

  @ApiProperty({
    type: String,
    description: "The min of the SalaryCountry",
    example: "100000",
  })
  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  min_salary: number;

  @ApiProperty({
    type: String,
    description: "The max of the SalaryCountry",
    example: "150000",
  })
  @Column("decimal", { transformer: new ColumnNumericTransformer() })
  max_salary: number;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstSalaryCountry, (model) => model.id)
  @JoinColumn({ name: "salary_country_id" })
  salary_country: MstSalaryCountry;

  @ManyToOne(() => MstSalaryCountry, (model) => model.id)
  @JoinColumn({ name: "salary_country_id" })
  salaryCountry: MstSalaryCountry;
}
