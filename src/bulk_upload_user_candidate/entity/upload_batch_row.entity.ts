import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { UploadBatch } from "./upload_batch.entity";
import { UPLOAD_BATCH_ROW_TYPES, UploadBatchRowType } from "../constants/constants";

export enum RowStatus {
  PENDING = "PENDING",
  IN_PROCESS = "IN_PROCESS",
  VALID = "VALID",
  INVALID = "INVALID",
  FAILED = "FAILED",
  DELETED = "DELETED",
}

@Entity("upload_batch_rows")
export class UploadBatchRow extends BaseEntity {
  @ApiProperty({
    type: String,
    description: "The batch ID this row belongs to",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column({ type: "uuid" })
  batch_id: string;

  @ManyToOne(() => UploadBatch, (batch) => batch.rows)
  @JoinColumn({ name: "batch_id" })
  batch: UploadBatch;

  @ApiProperty({
    type: String,
    description: "Type of the upload batch row",
    example: UPLOAD_BATCH_ROW_TYPES.CANDIDATE_REGISTRATION,
    enum: UPLOAD_BATCH_ROW_TYPES,
  })
  @Column({ type: "varchar", length: 50 })
  type: UploadBatchRowType;

  @ApiProperty({
    type: Object,
    description: "Additional data in JSON format based on row type",
    example: { email: "user@example.com", name: "John Doe", phone: "+6281234567890", gender: "male" },
  })
  @Column({ type: "jsonb" })
  additional_data: Record<string, any>;

  @ApiProperty({
    type: String,
    description: "Row processing status",
    example: "PENDING",
    enum: RowStatus,
  })
  @Column({
    type: "varchar",
    length: 50,
    default: RowStatus.PENDING,
  })
  row_status: RowStatus;

  @ApiProperty({
    type: [String],
    description: "Error messages if any",
    example: ["Invalid email format", "Duplicate email"],
    nullable: true,
  })
  @Column({ type: "text", array: true, nullable: true })
  error_messages: string[] | null;
}