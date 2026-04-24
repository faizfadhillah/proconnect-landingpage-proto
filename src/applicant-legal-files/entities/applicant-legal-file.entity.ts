// src\applicant-legal-files\entities\applicant-legal-file.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { Applicant } from "src/applicants/entities/applicant.entity";

export enum FileType {
  PDF = "pdf",
  DOC = "doc",
  DOCX = "docx",
  XLS = "xls",
  XLSX = "xlsx",
  JPG = "jpg",
  JPEG = "jpeg",
  PNG = "png",
  OTHER = "other",
}

@Entity("applicant_legal_files")
export class ApplicantLegalFile extends BaseEntity {
  @Column("uuid")
  applicant_id: string;

  @Column({ length: 255 })
  file_name: string;

  @Column({
    type: "enum",
    enum: FileType,
  })
  file_type: FileType;

  @Column({ length: 255 })
  file_url: string;

  @Column({ type: "timestamp" })
  uploaded_at: Date;

  @ManyToOne(() => Applicant, (model) => model.id)
  @JoinColumn({ name: "applicant_id" })
  applicant: Applicant;
}
