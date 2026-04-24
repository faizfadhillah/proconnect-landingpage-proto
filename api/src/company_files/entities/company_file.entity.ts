// src/entities/company_file.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "../../base.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";

export enum FileType {
  PDF = "pdf",
  DOC = "doc",
  DOCX = "docx",
  XLS = "xls",
  XLSX = "xlsx",
  JPG = "jpg",
  JPEG = "jpeg",
  PNG = "png",
  WEBP = "webp",
}

@Entity("company_files")
export class CompanyFile extends BaseEntity {
  @Column("uuid")
  company_id: string;

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

  @ManyToOne(() => MstCompany, (model) => model.id)
  @JoinColumn({ name: "company_id" })
  company: MstCompany;
}
