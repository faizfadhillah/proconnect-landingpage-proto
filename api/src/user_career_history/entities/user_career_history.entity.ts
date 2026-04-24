// src\user_career_history\entities\user_career_history.entity.ts
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { User } from "src/users/entities/user.entity";
import { BaseEntity } from "src/base.entity";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";

@Entity("user_career_history")
export class UserCareerHistory extends BaseEntity {
  @ApiProperty({
    description: "The identifier of the user",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The name of the company",
    example: "Acme Corporation",
    maxLength: 255,
  })
  @Column({ length: 255 })
  company_name: string;

  @ApiProperty({
    description: "The profession id from mst_profession",
    example: "Software Engineer",
  })
  @Column("uuid")
  profession_id: string;

  @ApiProperty({
    description: "The other job title ",
    example: "Software Engineer (di isi bila pilih others pada profession_id)",
    maxLength: 255,
  })
  @Column({ length: 255 })
  job_title: string;

  @ApiProperty({
    description: "The start date of the job",
    example: "2020-01-01",
  })
  @Type(() => Date)
  @Column({ type: "date" })
  start_date: Date;

  @ApiProperty({
    description: "The end date of the job",
    example: "2023-01-01",
  })
  @Type(() => Date)
  @Column({ type: "date", nullable: true })
  end_date: Date;

  @ApiProperty({
    description: "Whether this is the current job",
    example: false,
  })
  @Column({ type: "boolean" })
  is_current: boolean;

  @ApiProperty({
    description: "The job description",
    example:
      "Developed and maintained web applications using React and Node.js",
  })
  @Column({ type: "text" })
  job_description: string;

  @ApiProperty({
    description: "Achievement",
    example: [
      {
        achievement_name: "Something",
        achievement_date: "2022-04-01",
        description: "Something Description",
        file_link: "https://google.com",
      },
    ],
  })
  @Column({ type: "jsonb" })
  achievement_history: object | null;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstProfession, (model) => model.id)
  @JoinColumn({ name: "profession_id" })
  profession: MstProfession;
}
