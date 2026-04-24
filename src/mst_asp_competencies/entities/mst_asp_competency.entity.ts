import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../base.entity";

@Entity("mst_asp_competencies")
export class MstAspCompetency extends BaseEntity {
  @Column({ length: 255, nullable: true })
  primary_division: string;

  @Column({ length: 255, nullable: true })
  secondary_division: string;

  @Column({ length: 64, nullable: true })
  job_index_number: string;

  @Column({ length: 255, nullable: true })
  job_titles: string;

  @Column({ length: 128, nullable: true })
  competency_type: string;

  @Column({ type: "text", nullable: true })
  competency_standard: string;

  @Column({ length: 64, nullable: true })
  competency_cluster_code: string;

  @Column({ type: "text", nullable: true })
  skills: string;
}
