import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, OneToMany } from "typeorm";
import { UploadBatchRow } from "./upload_batch_row.entity";

@Entity("upload_batches")
export class UploadBatch extends BaseEntity {
  @ApiProperty({
    type: String,
    description: "The user ID who uploaded the batch",
    example: "123e4567-e89b-12d3-a456-426614174001",
    nullable: true,
  })
  @Column({ type: "uuid", nullable: true })
  uploaded_by: string | null;

  @ApiProperty({
    type: Number,
    description: "Total number of rows in the batch",
    example: 100,
  })
  @Column({ type: "int" })
  total_rows: number;

  @ApiProperty({
    type: Number,
    description: "Number of valid rows processed successfully",
    example: 85,
  })
  @Column({ type: "int", default: 0 })
  valid_rows: number;

  @ApiProperty({
    type: Number,
    description: "Number of invalid rows (validation failures)",
    example: 15,
  })
  @Column({ type: "int", default: 0 })
  invalid_rows: number;

  @ApiProperty({
    type: Number,
    description: "Progress percentage (calculated field)",
    example: 100,
  })
  get progress_percentage(): number {
    if (this.total_rows === 0) return 0;
    return Math.round(((this.valid_rows + this.invalid_rows) / this.total_rows) * 100);
  }

  @OneToMany(() => UploadBatchRow, (row) => row.batch)
  rows: UploadBatchRow[];
}