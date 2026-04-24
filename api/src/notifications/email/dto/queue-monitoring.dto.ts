import { ApiProperty } from "@nestjs/swagger";
import { EmailSentStatus } from "../entity/email_log.entity";

export class QueueStatisticsDto {
  @ApiProperty({
    description: "Number of jobs currently being processed",
    example: 2,
  })
  active: number;

  @ApiProperty({
    description: "Number of jobs waiting in queue",
    example: 15,
  })
  waiting: number;

  @ApiProperty({
    description: "Number of jobs scheduled for future processing",
    example: 3,
  })
  delayed: number;

  @ApiProperty({
    description: "Number of failed jobs",
    example: 1,
  })
  failed: number;

  @ApiProperty({
    description: "Number of completed jobs",
    example: 1250,
  })
  completed: number;

  @ApiProperty({
    description: "Total number of jobs in queue",
    example: 21,
  })
  total: number;
}

export class QueueStatusDto {
  @ApiProperty({
    description: "Queue name",
    example: "send-email",
  })
  queueName: string;

  @ApiProperty({
    description: "Redis connection status",
    example: true,
  })
  isConnected: boolean;

  @ApiProperty({
    description: "Queue statistics",
    type: QueueStatisticsDto,
  })
  statistics: QueueStatisticsDto;

  @ApiProperty({
    description: "Timestamp of last update",
    example: "2024-01-01T12:00:00.000Z",
  })
  lastUpdated: Date;
}

export class JobDetailsDto {
  @ApiProperty({
    description: "Bull job ID",
    example: "123",
  })
  id: string;

  @ApiProperty({
    description: "Job status",
    example: "active",
    enum: ["active", "waiting", "delayed", "failed", "completed"],
  })
  status: string;

  @ApiProperty({
    description: "Job creation timestamp",
    example: "2024-01-01T12:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Job processing start timestamp",
    example: "2024-01-01T12:00:05.000Z",
    nullable: true,
  })
  processedAt?: Date;

  @ApiProperty({
    description: "Job completion timestamp",
    example: "2024-01-01T12:00:10.000Z",
    nullable: true,
  })
  finishedAt?: Date;

  @ApiProperty({
    description: "Job failure timestamp",
    example: "2024-01-01T12:00:15.000Z",
    nullable: true,
  })
  failedAt?: Date;

  @ApiProperty({
    description: "Number of attempts made",
    example: 2,
  })
  attemptsMade: number;

  @ApiProperty({
    description: "Maximum number of attempts",
    example: 3,
  })
  attempts: number;

  @ApiProperty({
    description: "Delay in milliseconds (for delayed jobs)",
    example: 300000,
    nullable: true,
  })
  delay?: number;

  @ApiProperty({
    description: "Job data",
    example: {
      emailLogId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174001",
      email: "user@example.com",
    },
  })
  data: any;

  @ApiProperty({
    description: "Error message (for failed jobs)",
    example: "SMTP connection timeout",
    nullable: true,
  })
  errorMessage?: string;

  @ApiProperty({
    description: "Stack trace (for failed jobs)",
    example: "Error: SMTP connection timeout\n    at ...",
    nullable: true,
  })
  stacktrace?: string[];
}

export class EmailLogWithQueueDto {
  @ApiProperty({
    description: "Email log ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
    nullable: true,
  })
  userId?: string;

  @ApiProperty({
    description: "Email type",
    example: "user_candidate_bulk_direct_registration",
  })
  type: string;

  @ApiProperty({
    description: "Email sending status",
    example: "PENDING",
    enum: EmailSentStatus,
  })
  emailSentStatus: EmailSentStatus;

  @ApiProperty({
    description: "Email send timestamp",
    example: "2024-01-01T12:00:00.000Z",
    nullable: true,
  })
  emailSendAt?: Date;

  @ApiProperty({
    description: "Failure reason",
    example: "SMTP connection timeout",
    nullable: true,
  })
  emailFailedReason?: string;

  @ApiProperty({
    description: "Number of attempts",
    example: 2,
    nullable: true,
  })
  attemptCount?: number;

  @ApiProperty({
    description: "Maximum retries",
    example: 3,
    nullable: true,
  })
  maxRetries?: number;

  @ApiProperty({
    description: "Next retry timestamp",
    example: "2024-01-01T12:05:00.000Z",
    nullable: true,
  })
  nextRetryAt?: Date;

  @ApiProperty({
    description: "Bull queue job ID",
    example: "123",
    nullable: true,
  })
  jobId?: string;

  @ApiProperty({
    description: "Email log creation timestamp",
    example: "2024-01-01T12:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Email log update timestamp",
    example: "2024-01-01T12:00:00.000Z",
  })
  updatedAt: Date;

  @ApiProperty({
    description: "Queue job details (if available)",
    type: JobDetailsDto,
    nullable: true,
  })
  queueJob?: JobDetailsDto;

  @ApiProperty({
    description: "Estimated processing time in minutes (for pending jobs)",
    example: 5,
    nullable: true,
  })
  estimatedProcessingTimeMinutes?: number;
}

export class QueueJobsResponseDto {
  @ApiProperty({
    description: "List of jobs in the queue",
    type: [JobDetailsDto],
  })
  jobs: JobDetailsDto[];

  @ApiProperty({
    description: "Total number of jobs",
    example: 21,
  })
  total: number;

  @ApiProperty({
    description: "Pagination limit",
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: "Pagination offset",
    example: 0,
  })
  offset: number;
}

export class EmailLogsWithQueueResponseDto {
  @ApiProperty({
    description: "List of email logs with queue information",
    type: [EmailLogWithQueueDto],
  })
  emailLogs: EmailLogWithQueueDto[];

  @ApiProperty({
    description: "Total number of email logs",
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: "Pagination limit",
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: "Pagination offset",
    example: 0,
  })
  offset: number;
}