import { Processor, Process, InjectQueue } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { Injectable } from "@nestjs/common";
import { EmailLogsDao } from "../dao/email-logs.dao";
import { EmailSentStatus } from "../entity/email_log.entity";
import { SendRegistrationEmailJobData } from "../dto/email.dto";
import { EMAIL_QUEUE_NAMES } from "../constants/constants";
import { UsersService } from "src/users/users.service";
import { MailjetService } from "src/users/mailjet.service";
import { hasRetryableErrors, isMailjetSuccessResponse, MailjetErrorResponse, getMailjetErrorMessages } from "src/users/dto/mailjet-response.dto";
import { LoggingService } from "src/logs/logs.service";

@Processor(EMAIL_QUEUE_NAMES.SEND_EMAIL)
@Injectable()
export class EmailQueueProcessor {
  constructor(
    private readonly emailLogsDao: EmailLogsDao,
    @InjectQueue(EMAIL_QUEUE_NAMES.SEND_EMAIL) private readonly emailQueue: Queue,
    private readonly mailjetService: MailjetService,
    private readonly userService: UsersService,
    private readonly loggingService: LoggingService,
  ) { }

  @Process(EMAIL_QUEUE_NAMES.SEND_EMAIL)
  async handleSendRegistrationEmail(job: Job<SendRegistrationEmailJobData>): Promise<void> {
    const { emailLogId, userId, email, password } = job.data;

    try {
      this.loggingService.log(`Processing email job for user ${userId} (${email})`);

      // Update email log status to processing and save job ID
      await this.emailLogsDao.updateStatus(emailLogId, EmailSentStatus.PENDING);

      const user = await this.userService.findByEmail(email);
      if (!user) {
        throw new Error(`User not found for email ${email}`);
      }

      const response = await this.mailjetService.sendInviteCandidate(user, email, password, emailLogId);
      if (response && isMailjetSuccessResponse(response)) {
        // Update email log to success
        await this.emailLogsDao.updateStatus(
          emailLogId,
          EmailSentStatus.SUCCESS,
          new Date(),
          undefined
        );

        this.loggingService.log(`Successfully sent registration email to ${email}`);
        return
      }

      // handle error
      const errorResponse = response as MailjetErrorResponse;
      const errorMessage = getMailjetErrorMessages(errorResponse);
      await this.handleErrorEmail(emailLogId, userId, email, password, errorMessage, hasRetryableErrors(errorResponse));
    } catch (error) {
      this.loggingService.error(`Failed to send registration email to ${email}:`, error);

      await this.handleErrorEmail(emailLogId, userId, email, password, error.message, true);
    }
  }

  private async handleErrorEmail(emailLogId: string, userId: string, email: string, password: string, errorMessage: string, isNeedRetry: boolean) {
    this.loggingService.error(`Failed to send registration email to ${email}:`, errorMessage);

    // Update email log to failed
    await this.emailLogsDao.updateStatus(
      emailLogId,
      EmailSentStatus.FAILED,
      undefined,
      errorMessage
    );

    if (!isNeedRetry) {
      this.loggingService.warn(`No retry needed for email ${email}`);
      return
    }

    // Check if we should retry
    const emailLog = await this.emailLogsDao.findById(emailLogId);
    const attemptCount = emailLog?.attempt_count || 0;
    const maxRetries = emailLog?.max_retries || 3;

    if (attemptCount < maxRetries) {
      await this.scheduleRetry(emailLogId, userId, email, password, attemptCount);
    } else {
      this.loggingService.warn(`Max retries reached for email ${email}. Marking as RETRY_NEEDED for manual intervention.`);
      await this.emailLogsDao.updateStatus(emailLogId, EmailSentStatus.RETRY_NEEDED);
    }
  }

  private async scheduleRetry(emailLogId: string, userId: string, email: string, password: string, attemptCount: number) {
    // Increment attempt count
    await this.emailLogsDao.incrementAttemptCount(emailLogId);

    // Calculate retry delay with exponential backoff
    const nextRetryDelay = this.calculateRetryDelay(attemptCount);

    // Update next retry time
    await this.emailLogsDao.updateNextRetryAt(emailLogId, new Date(Date.now() + nextRetryDelay));

    // Re-queue the job with delay
    const jobData: SendRegistrationEmailJobData = {
      emailLogId,
      userId,
      email,
      password,
    };
    const retryJob = await this.emailQueue.add(
      EMAIL_QUEUE_NAMES.SEND_EMAIL,
      jobData,
      {
        delay: nextRetryDelay,
        attempts: 1, // Let our retry logic handle attempts
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    // Update job ID for the retry
    await this.emailLogsDao.updateJobId(emailLogId, retryJob.id.toString());

    this.loggingService.log(`Scheduled retry ${attemptCount + 1} for email ${email} in ${nextRetryDelay}ms`);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attemptCount: number): number {
    // Exponential backoff starting from 5 minutes: 5 min -> 10 min -> 20 min -> 40 min -> 80 min, etc.
    const baseDelay = 5 * 60 * 1000; // 5 minutes in milliseconds
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount);

    // Cap at 24 hours to prevent excessive delays
    const maxDelay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return Math.min(exponentialDelay, maxDelay);
  }

}