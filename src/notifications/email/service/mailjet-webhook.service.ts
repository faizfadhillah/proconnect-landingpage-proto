import { Injectable } from "@nestjs/common";
import { EmailLogsDao } from "../dao/email-logs.dao";
import { EmailLog, EmailSentStatus } from "../entity/email_log.entity";
import {
  MailjetWebhookEventDto,
  MailjetSentEventDto,
  MailjetOpenEventDto,
  MailjetClickEventDto,
  MailjetBounceEventDto,
  MailjetSpamEventDto,
  MailjetUnsubEventDto,
} from "../dto/mailjet-webhook.dto";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class MailjetWebhookService {
  constructor(
    private readonly emailLogsDao: EmailLogsDao,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Process a single webhook event
   */
  async processEvent(event: MailjetWebhookEventDto): Promise<void> {
    this.loggingService.log(`Received webhook event: ${JSON.stringify(event)}`);

    // Skip events without CustomID (not from our system)
    if (!event.CustomID) {
      this.loggingService.warn(`Webhook event without CustomID received: ${event.event}`);
      return;
    }

    // Find the email log by custom ID
    const emailLog = await this.emailLogsDao.findByCustomId(event.CustomID);
    if (!emailLog) {
      this.loggingService.warn(`Email log not found for CustomID: ${event.CustomID}`);
      return;
    }

    this.loggingService.log(`Processing ${event.event} event for email: ${event.email}`);

    // Process based on event type
    switch (event.event) {
      case "sent":
        await this.handleSentEvent(emailLog, event as MailjetSentEventDto);
        break;
      case "open":
        await this.handleOpenEvent(emailLog, event as MailjetOpenEventDto);
        break;
      case "click":
        await this.handleClickEvent(emailLog, event as MailjetClickEventDto);
        break;
      case "bounce":
        await this.handleBounceEvent(emailLog, event as MailjetBounceEventDto);
        break;
      case "blocked":
        await this.handleBlockedEvent(emailLog, event);
        break;
      case "spam":
        await this.handleSpamEvent(emailLog, event as MailjetSpamEventDto);
        break;
      case "unsub":
        await this.handleUnsubEvent(emailLog, event as MailjetUnsubEventDto);
        break;
      default:
        this.loggingService.warn(`Unknown webhook event type: ${event.event}`);
        // Still store the event data for audit
        await this.emailLogsDao.updateFromWebhook(
          emailLog.id,
          emailLog.email_sent_status, // Keep current status
          new Date(event.time * 1000),
          undefined,
          event,
        );
        break;
    }
  }

  /**
   * Handle sent event - email accepted by Mailjet
   */
  private async handleSentEvent(
    emailLog: EmailLog,
    event: MailjetSentEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      EmailSentStatus.SENT,
      eventTime,
      undefined,
      event,
    );

    this.loggingService.log(`Email marked as SENT for: ${event.email}`);
  }

  /**
   * Handle open event - email opened by recipient
   */
  private async handleOpenEvent(
    emailLog: EmailLog,
    event: MailjetOpenEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      EmailSentStatus.OPENED,
      eventTime,
      undefined,
      event,
    );

    this.loggingService.log(`Email marked as OPENED for: ${event.email}`);
  }

  /**
   * Handle click event - link clicked by recipient
   */
  private async handleClickEvent(
    emailLog: EmailLog,
    event: MailjetClickEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      EmailSentStatus.CLICKED,
      eventTime,
      undefined,
      event,
    );

    this.loggingService.log(`Email marked as CLICKED for: ${event.email}, URL: ${event.url}`);
  }

  /**
   * Handle bounce event - email delivery failed
   */
  private async handleBounceEvent(
    emailLog: EmailLog,
    event: MailjetBounceEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    // Determine bounce type
    const status = event.hard_bounce ? EmailSentStatus.HARD_BOUNCED : EmailSentStatus.BOUNCED;
    
    // Build error reason
    const errorReason = this.buildBounceErrorReason(event);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      status,
      eventTime,
      errorReason,
      event,
    );

    this.loggingService.log(`Email marked as ${status} for: ${event.email}, Reason: ${errorReason}`);
  }

  /**
   * Handle blocked event - email blocked by Mailjet
   */
  private async handleBlockedEvent(
    emailLog: EmailLog,
    event: MailjetWebhookEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      EmailSentStatus.BLOCKED,
      eventTime,
      "Email blocked by Mailjet",
      event,
    );

    this.loggingService.log(`Email marked as BLOCKED for: ${event.email}`);
  }

  /**
   * Handle spam event - marked as spam by recipient
   */
  private async handleSpamEvent(
    emailLog: EmailLog,
    event: MailjetSpamEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      EmailSentStatus.SPAM,
      eventTime,
      `Marked as spam, source: ${event.source}`,
      event,
    );

    this.loggingService.log(`Email marked as SPAM for: ${event.email}`);
  }

  /**
   * Handle unsub event - recipient unsubscribed
   */
  private async handleUnsubEvent(
    emailLog: EmailLog,
    event: MailjetUnsubEventDto,
  ): Promise<void> {
    const eventTime = new Date(event.time * 1000);
    
    await this.emailLogsDao.updateFromWebhook(
      emailLog.id,
      EmailSentStatus.UNSUBSCRIBED,
      eventTime,
      "Recipient unsubscribed",
      event,
    );

    this.loggingService.log(`Recipient UNSUBSCRIBED: ${event.email}`);
  }

  /**
   * Build detailed error reason for bounce events
   */
  private buildBounceErrorReason(event: MailjetBounceEventDto): string {
    const parts: string[] = [];

    if (event.error_related_to) {
      parts.push(`Related to: ${event.error_related_to}`);
    }

    if (event.error) {
      parts.push(`Error: ${event.error}`);
    }

    if (event.comment) {
      parts.push(`Comment: ${event.comment}`);
    }

    if (event.hard_bounce) {
      parts.push("Type: Hard bounce (permanent failure)");
    } else {
      parts.push("Type: Soft bounce (temporary failure)");
    }

    return parts.join(" | ");
  }
}