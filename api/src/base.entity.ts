// base.entity.ts
import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  VersionColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid") // This will automatically generate UUIDv4
  @ApiProperty({
    description: "The ID of the entity",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: "uuid", nullable: true })
  created_by: string | null;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "uuid", nullable: true })
  updated_by: string | null;

  @VersionColumn({ default: 0 })
  version!: number;

  @DeleteDateColumn()
  deleted_at: Date | null;

  constructor() {}
}
