import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailLog, EmailSentStatus } from "../entity/email_log.entity";

@Injectable()
export class EmailLogsDao {
  constructor(
    @InjectRepository(EmailLog)
    private readonly emailLogRepository: Repository<EmailLog>,
  ) {}

  async create(emailLog: Partial<EmailLog>): Promise<EmailLog> {
    const log = this.emailLogRepository.create(emailLog);
    return await this.emailLogRepository.save(log);
  }

  async findById(id: string): Promise<EmailLog | null> {
    return await this.emailLogRepository.findOne({
      where: { id },
      relations: ["user"],
    });
  }

  async updateStatus(
    id: string,
    status: EmailSentStatus,
    emailSendAt?: Date,
    emailFailedReason?: string,
  ): Promise<void> {
    const updateData: Partial<EmailLog> = { email_sent_status: status };

    if (emailSendAt) {
      updateData.email_send_at = emailSendAt;
    }

    if (emailFailedReason) {
      updateData.email_failed_reason = emailFailedReason;
    }

    await this.emailLogRepository.update(id, updateData);
  }

  async incrementAttemptCount(id: string): Promise<void> {
    await this.emailLogRepository
      .createQueryBuilder()
      .update(EmailLog)
      .set({
        attempt_count: () => "COALESCE(attempt_count, 0) + 1",
      })
      .where("id = :id", { id })
      .execute();
  }

  async findRetryableEmails(type: string, limit: number = 50): Promise<EmailLog[]> {
    return await this.emailLogRepository
      .createQueryBuilder("log")
      .where("log.type = :type", { type })
      .andWhere("log.email_sent_status IN (:...statuses)", {
        statuses: [EmailSentStatus.RETRY_NEEDED, EmailSentStatus.PENDING],
      })
      .andWhere("(log.next_retry_at IS NULL OR log.next_retry_at <= :now)", {
        now: new Date(),
      })
      .andWhere(
        "(log.attempt_count IS NULL OR log.max_retries IS NULL OR log.attempt_count < log.max_retries)",
      )
      .orderBy("log.next_retry_at", "ASC")
      .limit(limit)
      .getMany();
  }

  async findByTypeAndStatus(type: string, status: EmailSentStatus): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      where: { type, email_sent_status: status },
      order: { created_at: "ASC" },
    });
  }

  async findAllWithPagination(limit: number = 50, offset: number = 0): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      relations: ["user"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async findByStatusWithPagination(status: EmailSentStatus, limit: number = 50, offset: number = 0): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      where: { email_sent_status: status },
      relations: ["user"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async findByTypeWithPagination(type: string, limit: number = 50, offset: number = 0): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      where: { type },
      relations: ["user"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async countByType(type: string): Promise<number> {
    return await this.emailLogRepository.count({ where: { type } });
  }

  async countByStatus(status: EmailSentStatus): Promise<number> {
    return await this.emailLogRepository.count({ where: { email_sent_status: status } });
  }

  async countAll(): Promise<number> {
    return await this.emailLogRepository.count();
  }

  async updateNextRetryAt(id: string, nextRetryAt: Date): Promise<void> {
    await this.emailLogRepository.update(id, { next_retry_at: nextRetryAt });
  }

  async resetForRetry(id: string, maxRetries?: number): Promise<void> {
    const updateData: Partial<EmailLog> = {
      email_sent_status: EmailSentStatus.PENDING,
      email_failed_reason: null,
      next_retry_at: null,
    };

    if (maxRetries !== undefined) {
      updateData.max_retries = maxRetries;
    }

    await this.emailLogRepository.update(id, updateData);
  }

  async updateJobId(id: string, jobId: string): Promise<void> {
    await this.emailLogRepository.update(id, { job_id: jobId });
  }

  /**
   * Get email logs by emails for specific type
   */
  async getEmailLogsByEmails(emails: string[], type: string): Promise<any[]> {
    if (emails.length === 0) {
      return [];
    }

    // Using raw query for better performance with IN clause
    const emailLogs = await this.emailLogRepository.manager.query(`
      SELECT
        id,
        email,
        email_sent_status,
        email_send_at,
        email_failed_reason,
        created_at
      FROM email_logs
      WHERE email = ANY($1)
        AND type = $2
      ORDER BY created_at DESC
    `, [emails, type]);

    return emailLogs;
  }

  /**
   * Find email log by custom ID (email_log_id sent to Mailjet)
   */
  async findByCustomId(customId: string): Promise<EmailLog | null> {
    return await this.emailLogRepository.findOne({
      where: { id: customId },
      relations: ["user"],
    });
  }

  /**
   * Update email log from webhook event
   */
  async updateFromWebhook(
    id: string,
    status: EmailSentStatus,
    eventTime: Date,
    errorReason?: string,
    webhookData?: any,
  ): Promise<void> {
    const updateData: Partial<EmailLog> = {
      email_sent_status: status,
    };

    // Set specific timestamps based on event type
    switch (status) {
      case EmailSentStatus.OPENED:
        updateData.opened_at = eventTime;
        break;
      case EmailSentStatus.CLICKED:
        updateData.clicked_at = eventTime;
        break;
      case EmailSentStatus.BOUNCED:
      case EmailSentStatus.HARD_BOUNCED:
        updateData.bounced_at = eventTime;
        break;
      case EmailSentStatus.SENT:
      case EmailSentStatus.DELIVERED:
        updateData.email_send_at = eventTime;
        break;
    }

    // Add error reason if provided
    if (errorReason) {
      updateData.email_failed_reason = errorReason;
    }

    // Update webhook events array
    if (webhookData) {
      const currentLog = await this.findById(id);
      const currentEvents = currentLog?.webhook_events || {};
      
      // Add new event to the events object
      const eventType = webhookData.event;
      currentEvents[eventType] = currentEvents[eventType] || [];
      currentEvents[eventType].push({
        ...webhookData,
        processed_at: new Date(),
      });

      updateData.webhook_events = currentEvents;
    }

    await this.emailLogRepository.update(id, updateData);
  }
}