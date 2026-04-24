// src/user_right_to_work/entities/user-right-to-work.entity.ts
import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity } from "../../base.entity";
import { Entity, Column, JoinColumn, ManyToOne } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { MstSalaryCountry } from "src/mst_salary_country/entities/mst_salary_country.entity";
import { MstRightToWork } from "src/mst_right_to_works/entities/mst_right_to_work.entity";

@Entity("user_right_to_works")
export class UserRightToWork extends BaseEntity {
  @Column("uuid")
  user_id!: string;

  @ApiProperty({
    description: "The ID of the SalaryCountry",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @Column("uuid")
  salary_country_id: string;

  @Column("uuid")
  right_to_work_id!: string;

  @ApiProperty({
    description: "The file attachment url",
    example: "http://cdn.aseanta.com/file.pdf",
    maxLength: 255,
  })
  @Column({ length: 255 })
  file_url: string;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstSalaryCountry, (model) => model.id)
  @JoinColumn({ name: "salary_country_id" })
  salary_country: MstSalaryCountry;

  @ManyToOne(() => MstSalaryCountry, (model) => model.id)
  @JoinColumn({ name: "salary_country_id" })
  salaryCountry: MstSalaryCountry;

  @ManyToOne(() => MstRightToWork, (model) => model.id)
  @JoinColumn({ name: "right_to_work_id" })
  right_to_work: MstRightToWork;
}
