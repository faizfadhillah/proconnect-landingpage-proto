import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue, Job } from "bull";
import { EmailLogsDao } from "../dao/email-logs.dao";
import { EMAIL_QUEUE_NAMES } from "../constants/constants";
import {
  QueueStatisticsDto,
  QueueStatusDto,
  JobDetailsDto,
  EmailLogWithQueueDto,
  QueueJobsResponseDto,
  EmailLogsWithQueueResponseDto,
} from "../dto/queue-monitoring.dto";
import { EmailLog } from "../entity/email_log.entity";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class QueueMonitoringService {
  constructor(
    @InjectQueue(EMAIL_QUEUE_NAMES.SEND_EMAIL)
    private readonly emailQueue: Queue,
    private readonly emailLogsDao: EmailLogsDao,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Get comprehensive queue status and statistics
   */
  async getQueueStatus(): Promise<QueueStatusDto> {
    try {
      const [waiting, active, delayed, failed, completed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getDelayed(),
        this.emailQueue.getFailed(),
        this.emailQueue.getCompleted(0, 1000), // Get last 1000 completed jobs
      ]);

      const statistics: QueueStatisticsDto = {
        active: active.length,
        waiting: waiting.length,
        delayed: delayed.length,
        failed: failed.length,
        completed: completed.length,
        total: active.length + waiting.length + delayed.length + failed.length,
      };

      // Check Redis connection
      let isConnected = true;
      try {
        await this.emailQueue.client.ping();
      } catch (error) {
        this.loggingService.warn("Redis connection check failed:", error);
        isConnected = false;
      }

      return {
        queueName: EMAIL_QUEUE_NAMES.SEND_EMAIL,
        isConnected,
        statistics,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.loggingService.error("Failed to get queue status:", error);
      throw error;
    }
  }

  /**
   * Get detailed information about all jobs in the queue
   */
  async getQueueJobs(limit: number = 50, offset: number = 0): Promise<QueueJobsResponseDto> {
    try {
      const [waitingJobs, activeJobs, delayedJobs, failedJobs] = await Promise.all([
        this.emailQueue.getWaiting(offset, limit),
        this.emailQueue.getActive(offset, limit),
        this.emailQueue.getDelayed(offset, limit),
        this.emailQueue.getFailed(offset, limit),
      ]);

      const allJobs = [
        ...waitingJobs.map(job => this.mapJobToDto(job, "waiting")),
        ...activeJobs.map(job => this.mapJobToDto(job, "active")),
        ...delayedJobs.map(job => this.mapJobToDto(job, "delayed")),
        ...failedJobs.map(job => this.mapJobToDto(job, "failed")),
      ];

      // Sort by creation time (newest first) and apply pagination
      const sortedJobs = allJobs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(offset, offset + limit);

      return {
        jobs: sortedJobs,
        total: allJobs.length,
        limit,
        offset,
      };
    } catch (error) {
      this.loggingService.error("Failed to get queue jobs:", error);
      throw error;
    }
  }

  /**
   * Get email logs with associated queue job information
   */
  async getEmailLogsWithQueueStatus(
    limit: number = 50,
    offset: number = 0,
    status?: string,
    type?: string,
  ): Promise<EmailLogsWithQueueResponseDto> {
    try {
      // Get email logs from database with proper pagination
      let emailLogs: EmailLog[];
      let total: number;

      if (status && type) {
        emailLogs = await this.emailLogsDao.findByTypeAndStatus(type, status as any);
        total = emailLogs.length;
        emailLogs = emailLogs.slice(offset, offset + limit);
      } else if (type) {
        emailLogs = await this.emailLogsDao.findByTypeWithPagination(type, limit, offset);
        total = await this.emailLogsDao.countByType(type);
      } else if (status) {
        emailLogs = await this.emailLogsDao.findByStatusWithPagination(status as any, limit, offset);
        total = await this.emailLogsDao.countByStatus(status as any);
      } else {
        emailLogs = await this.emailLogsDao.findAllWithPagination(limit, offset);
        total = await this.emailLogsDao.countAll();
      }

      // Enrich with queue job information
      const enrichedLogs = await Promise.all(
        emailLogs.map(async (log) => {
          const queueJob = log.job_id ? await this.getJobDetailsById(log.job_id) : null;

          return {
            id: log.id,
            userId: log.user_id || undefined,
            type: log.type,
            emailSentStatus: log.email_sent_status,
            emailSendAt: log.email_send_at || undefined,
            emailFailedReason: log.email_failed_reason || undefined,
            attemptCount: log.attempt_count || undefined,
            maxRetries: log.max_retries || undefined,
            nextRetryAt: log.next_retry_at || undefined,
            jobId: log.job_id || undefined,
            createdAt: log.created_at,
            updatedAt: log.updated_at,
            queueJob: queueJob || undefined,
            estimatedProcessingTimeMinutes: this.calculateEstimatedProcessingTime(log, queueJob),
          } as EmailLogWithQueueDto;
        }),
      );

      return {
        emailLogs: enrichedLogs,
        total,
        limit,
        offset,
      };
    } catch (error) {
      this.loggingService.error("Failed to get email logs with queue status:", error);
      throw error;
    }
  }

  /**
   * Get specific job details by job ID
   */
  private async getJobDetailsById(jobId: string): Promise<JobDetailsDto | null> {
    try {
      const job = await this.emailQueue.getJob(jobId);
      if (!job) return null;

      return this.mapJobToDto(job);
    } catch (error) {
      this.loggingService.warn(`Failed to get job details for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Map Bull job to DTO
   */
  private mapJobToDto(job: Job, overrideStatus?: string): JobDetailsDto {
    const state = overrideStatus || job.opts?.delay ? "delayed" : job.finishedOn ? "completed" : job.failedReason ? "failed" : "active";

    return {
      id: job.id.toString(),
      status: state,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      failedAt: job.failedReason ? new Date(job.finishedOn || job.timestamp) : undefined,
      attemptsMade: job.attemptsMade,
      attempts: job.opts?.attempts || 1,
      delay: job.opts?.delay || undefined,
      data: job.data,
      errorMessage: job.failedReason || undefined,
      stacktrace: job.stacktrace || undefined,
    };
  }

  /**
   * Calculate estimated processing time for pending jobs
   */
  private calculateEstimatedProcessingTime(log: EmailLog, queueJob?: JobDetailsDto | null): number | undefined {
    if (!queueJob || log.email_sent_status !== "PENDING") return undefined;

    // For delayed jobs, calculate based on delay
    if (queueJob.delay && queueJob.delay > 0) {
      return Math.ceil(queueJob.delay / (1000 * 60)); // Convert to minutes
    }

    // For active jobs, estimate based on processing time (this is a rough estimate)
    if (queueJob.status === "active") {
      // Assume average processing time of 30 seconds
      return 1; // 1 minute
    }

    return undefined;
  }

  /**
   * Get queue performance metrics
   */
  async getQueueMetrics(timeRangeHours: number = 24): Promise<any> {
    try {
      const since = Date.now() - (timeRangeHours * 60 * 60 * 1000);

      const [completed, failed] = await Promise.all([
        this.emailQueue.getCompleted(0, 1000),
        this.emailQueue.getFailed(0, 1000),
      ]);

      const recentCompleted = completed.filter(job => job.finishedOn && job.finishedOn > since);
      const recentFailed = failed.filter(job => job.finishedOn && job.finishedOn > since);

      const totalProcessed = recentCompleted.length + recentFailed.length;
      const successRate = totalProcessed > 0 ? (recentCompleted.length / totalProcessed) * 100 : 0;

      // Calculate average processing time
      const processingTimes = recentCompleted
        .filter(job => job.processedOn && job.finishedOn)
        .map(job => job.finishedOn! - job.processedOn!);

      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      return {
        timeRangeHours,
        totalProcessed,
        successfulJobs: recentCompleted.length,
        failedJobs: recentFailed.length,
        successRate: Math.round(successRate * 100) / 100,
        averageProcessingTimeMs: Math.round(avgProcessingTime),
        averageProcessingTimeSeconds: Math.round(avgProcessingTime / 1000),
      };
    } catch (error) {
      this.loggingService.error("Failed to get queue metrics:", error);
      throw error;
    }
  }
}