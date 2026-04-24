// src/applicants\entities\applicant.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { Job } from "src/jobs/entities/job.entity";
import { User } from "src/users/entities/user.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";

export enum ApplicantStatus {
  SAVED = "SAVED",
  NEED_REVIEW = "NEED_REVIEW",
  CONNECT = "CONNECT",
  PROCESS = "PROCESS",
  SCHEDULE_INTERVIEW = "SCHEDULE_INTERVIEW",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

@Entity("applicants")
export class Applicant extends BaseEntity {
  @Column("uuid")
  job_id: string;

  @Column("uuid")
  user_id: string;

  @Column("jsonb")
  attributes: Record<string, any>;

  @Column("uuid")
  region_id: string;

  @Column({ default: false })
  is_premium: boolean;

  @Column({
    type: "enum",
    enum: ApplicantStatus,
  })
  status: ApplicantStatus;

  @ManyToOne(() => Job, (model) => model.id)
  @JoinColumn({ name: "job_id" })
  job: Job;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => MstRegion, (model) => model.id)
  @JoinColumn({ name: "region_id" })
  region: MstRegion;

  @Column("uuid")
  last_applicant_job_step_id: string;

  @OneToMany(() => ApplicantJobStep, (model) => model.applicant)
  applicantJobSteps: ApplicantJobStep[];

  @ManyToOne(() => ApplicantJobStep, (model) => model.id)
  @JoinColumn({ name: "last_applicant_job_step_id" })
  lastApplicantJobStep: ApplicantJobStep;
}
