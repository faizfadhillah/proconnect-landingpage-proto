import { BaseEntity } from "../../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "../../../users/entities/user.entity";
import { EMAIL_TYPES } from "../constants/constants";

export enum EmailSentStatus {
  PENDING = "PENDING",
  RETRY_NEEDED = "RETRY_NEEDED",
  FAILED = "FAILED",
  SUCCESS = "SUCCESS",
  // Webhook-based statuses
  SENT = "SENT",           // Mailjet accepted the email
  DELIVERED = "DELIVERED", // Email delivered to recipient
  BOUNCED = "BOUNCED",     // Email bounced (soft bounce)
  HARD_BOUNCED = "HARD_BOUNCED", // Permanent bounce
  OPENED = "OPENED",       // Email opened
  CLICKED = "CLICKED",     // Link clicked
  SPAM = "SPAM",           // Marked as spam
  UNSUBSCRIBED = "UNSUBSCRIBED", // Recipient unsubscribed
  BLOCKED = "BLOCKED"      // Email blocked
}

@Entity("email_logs")
export class EmailLog extends BaseEntity {
  @ApiProperty({
    type: String,
    description: "The user ID associated with this email",
    example: "123e4567-e89b-12d3-a456-426614174001",
    nullable: true,
  })
  @Column({ type: "uuid", nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ApiProperty({
    type: String,
    description: "The type of email",
    example: EMAIL_TYPES.USER_CANDIDATE_BULK_DIRECT_REGISTRATION,
  })
  @Column({ length: 100 })
  type: string;

  @ApiProperty({
    type: String,
    description: "The email address",
    example: "user@example.com",
  })
  @Column({ length: 255})
  email: string;

  @ApiProperty({
    type: String,
    description: "The status of the email sending",
    example: "PENDING",
    enum: EmailSentStatus,
  })
  @Column({
    type: "varchar",
    length: 50,
    default: EmailSentStatus.PENDING,
  })
  email_sent_status: EmailSentStatus;

  @ApiProperty({
    type: Date,
    description: "When the email was sent",
    example: "2024-01-01T12:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  email_send_at: Date | null;

  @ApiProperty({
    type: String,
    description: "Reason for email sending failure",
    example: "SMTP connection timeout",
    nullable: true,
  })
  @Column({ type: "text", nullable: true })
  email_failed_reason: string | null;

  @ApiProperty({
    type: Number,
    description: "Number of attempts made to send this email",
    example: 2,
    nullable: true,
  })
  @Column({ type: "int", nullable: true })
  attempt_count: number | null;

  @ApiProperty({
    type: Number,
    description: "Maximum number of retry attempts",
    example: 5,
    nullable: true,
  })
  @Column({ type: "int", nullable: true })
  max_retries: number | null;

  @ApiProperty({
    type: Date,
    description: "Next retry attempt time",
    example: "2024-01-01T12:05:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  next_retry_at: Date | null;

  @ApiProperty({
    type: String,
    description: "Bull queue job ID",
    example: "job-123456789",
    nullable: true,
  })
  @Column({ length: 255, nullable: true })
  job_id: string | null;

  @ApiProperty({
    type: Date,
    description: "When the email was opened",
    example: "2024-01-01T12:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  opened_at: Date | null;

  @ApiProperty({
    type: Date,
    description: "When a link was clicked",
    example: "2024-01-01T12:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  clicked_at: Date | null;

  @ApiProperty({
    type: Date,
    description: "When the email bounced",
    example: "2024-01-01T12:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  bounced_at: Date | null;

  @ApiProperty({
    type: "object",
    description: "Webhook events data from Mailjet",
    example: { sent: { time: 1704115200, MessageID: "123456" } },
    nullable: true,
  })
  @Column({ type: "jsonb", nullable: true })
  webhook_events: any;
}