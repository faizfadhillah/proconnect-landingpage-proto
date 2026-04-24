import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { EmailLogsDao } from "../dao/email-logs.dao";
import { EmailSentStatus } from "../entity/email_log.entity";
import { EMAIL_QUEUE_NAMES, EMAIL_TYPES } from "../constants/constants";
import { SendRegistrationEmailJobData } from "../dto/email.dto";
import { UsersService } from "src/users/users.service";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class EmailService {
  constructor(
    private readonly emailLogsDao: EmailLogsDao,
    @InjectQueue(EMAIL_QUEUE_NAMES.SEND_EMAIL)
    private readonly emailQueue: Queue,
    private readonly userService: UsersService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Queue email for user
   */
  async queueEmailForUser(userId: string, email: string, type: string, password: string): Promise<void> {
    this.loggingService.log(`Queueing email for user ${userId} (${email}) with type ${type}`);

    // Create email log
    const emailLog = await this.emailLogsDao.create({
      user_id: userId,
      type,
      email_sent_status: EmailSentStatus.PENDING,
      email,
    });

    // Add to queue
    const jobData: SendRegistrationEmailJobData = {
      emailLogId: emailLog.id,
      userId,
      email,
      password: password,
    };
    const job = await this.emailQueue.add(
      EMAIL_QUEUE_NAMES.SEND_EMAIL,
      jobData,
      {
        attempts: 1, // use own logic for retry mechanism
      },
    );

    // Update job ID for the job
    await this.emailLogsDao.updateJobId(emailLog.id, job.id.toString());

    this.loggingService.log(`Email queued successfully for user ${userId} with job ID ${job.id}`);
  }

  /**
   * Retry failed emails
   */
  async retryFailedEmails(type: string): Promise<{ message: string; retryCount: number }> {
    this.loggingService.log(`Retrying failed emails for type: ${type}`);

    const emailLogs = await this.emailLogsDao.findByTypeAndStatus(
      type,
      EmailSentStatus.RETRY_NEEDED,
    );

    this.loggingService.log(`Found ${emailLogs.length} failed emails to retry`);

    let retryCount = 0;

    for (const log of emailLogs) {
      // Reset for retry
      await this.emailLogsDao.resetForRetry(log.id);

      // For bulk registration emails, we need to generate a new password and update Firebase
      let password = '';
      if (type === EMAIL_TYPES.USER_CANDIDATE_BULK_DIRECT_REGISTRATION) {
        // Generate new password for retry
        const newPassword = this.userService.generateRandomPassword(12);

        // Get user to update Firebase password
        const user = await this.userService.findOne(log.user_id);
        if (user) {
          await this.userService.updateFirebaseUserPassword(user.firebase_uid, newPassword);
          password = newPassword;
        }
      }

      // Re-queue
      const jobData: SendRegistrationEmailJobData = {
        emailLogId: log.id,
        userId: log.user_id,
        email: log.email,
        password: password,
      };
      const job = await this.emailQueue.add(EMAIL_QUEUE_NAMES.SEND_EMAIL, jobData);

      // Update job ID for the retry
      await this.emailLogsDao.updateJobId(log.id, job.id.toString());

      retryCount++;
    }

    this.loggingService.log(`Successfully retried ${retryCount} emails for type ${type}`);

    return {
      message: `Retried ${retryCount} failed emails`,
      retryCount,
    };
  }
}