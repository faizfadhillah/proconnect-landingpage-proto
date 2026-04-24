// src\applicant-steps\entities\applicant-step.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { Applicant } from "src/applicants/entities/applicant.entity";

export enum StepStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  REJECTED = "rejected",
  ON_HOLD = "on_hold",
}

@Entity("applicant_steps")
export class ApplicantStep extends BaseEntity {
  @Column("uuid")
  applicant_id: string;

  @Column({ length: 100 })
  step_name: string;

  @Column()
  step_order: number;

  @Column({
    type: "enum",
    enum: StepStatus,
  })
  status: StepStatus;

  @Column({ type: "text", nullable: true })
  notes: string;

  @ManyToOne(() => Applicant, (model) => model.id)
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;
}
