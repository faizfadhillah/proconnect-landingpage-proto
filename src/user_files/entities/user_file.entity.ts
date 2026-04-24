import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";

export enum FileType {
  PDF = "pdf",
  DOC = "doc",
  DOCX = "docx",
  XLS = "xls",
  XLSX = "xlsx",
  JPG = "jpg",
  PNG = "png",
  JPEG = "jpeg",
  WEBP = "webp",
}

@Entity("user_files")
export class UserFile extends BaseEntity {
  @ApiProperty({
    description: "The unique identifier of the user file",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    description: "The ID of the user who owns this file",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @Column("uuid")
  user_id: string;

  @ApiProperty({
    description: "The name of the file",
    example: "document.pdf",
    maxLength: 255,
  })
  @Column({ length: 255 })
  file_name: string;

  @ApiProperty({
    description: "The type of the file",
    enum: FileType,
    example: FileType.PDF,
  })
  @Column({
    type: "enum",
    enum: FileType,
  })
  file_type: FileType;

  @ApiProperty({
    description: "The URL where the file is stored",
    example: "https://example.com/files/document.pdf",
    maxLength: 255,
  })
  @Column({ length: 255 })
  file_url: string;

  @ApiProperty({
    description: "The date and time when the file was uploaded",
    example: "2023-06-15T10:30:00Z",
  })
  @Column({ type: "timestamp" })
  uploaded_at: Date;

  @ManyToOne(() => User, (model) => model.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
