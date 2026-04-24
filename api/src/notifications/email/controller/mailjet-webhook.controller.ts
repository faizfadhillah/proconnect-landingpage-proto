import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { MailjetWebhookService } from "../service/mailjet-webhook.service";
import { MailjetWebhookEventDto } from "../dto/mailjet-webhook.dto";
import { TestSendEmailDto } from "../dto/mailjet-webhook.dto";
import { EmailService } from "../service/email.service";
import { UsersService } from "src/users/users.service";
import { EMAIL_TYPES } from "../constants/constants";
import { Public } from "src/auth/public.decorator";
import { LoggingService } from "src/logs/logs.service";

@ApiTags("notifications")
@Controller("notifications")
@ApiBearerAuth()
export class MailjetWebhookController {
  private readonly webhookUsername = process.env.MAILJET_WEBHOOK_USERNAME || "webhook";
  private readonly webhookPassword = process.env.MAILJET_WEBHOOK_PASSWORD || "password";

  constructor(
    private readonly mailjetWebhookService: MailjetWebhookService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Handle Mailjet webhook events
   */
  @Post("webhook/mailjet")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Receive Mailjet webhook events" })
  @ApiBody({ type: MailjetWebhookEventDto })
  @ApiResponse({ status: 200, description: "Webhook events processed successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Public()
  async handleMailjetWebhook(
    @Body() event: MailjetWebhookEventDto,
    @Headers("authorization") authHeader: string,
  ): Promise<{ message: string }> {
    // Validate basic authentication
    if (!this.validateBasicAuth(authHeader)) {
      this.loggingService.warn("Unauthorized webhook access attempt");
      throw new UnauthorizedException("Invalid credentials");
    }

    // Process webhook events
    await this.mailjetWebhookService.processEvent(event);

    return {
      message: "Webhook events processed successfully",
    };
  }

  /**
   * Test endpoint to send email (for development/testing)
   */
  @Post("test/send-email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send test email" })
  @ApiBody({ type: TestSendEmailDto })
  @ApiResponse({ status: 200, description: "Test email sent successfully" })
  async testSendEmail(@Body() testData: TestSendEmailDto): Promise<{ message: string; emailLogId?: string }> {
    const { email } = testData;

    this.loggingService.log(`Sending test email to: ${email}`);

    try {
      // Create a test user or use existing one
      let user = await this.usersService.findByEmail(email);
      
      if (!user) {
        // Create a minimal user for testing
        user = await this.usersService.create({
          email: email,
          full_name: "Test User",
          firebase_uid: `test-${Date.now()}`,
          user_type: "candidate",
        } as any);
      }

      // Generate a random password for the test
      const password = this.usersService.generateRandomPassword(12);

      // Queue the email
      await this.emailService.queueEmailForUser(
        user.id,
        email,
        EMAIL_TYPES.USER_CANDIDATE_BULK_DIRECT_REGISTRATION,
        password,
      );

      this.loggingService.log(`Test email queued successfully for: ${email}`);

      return {
        message: "Test email queued successfully",
        emailLogId: user.id, // In real implementation, this would be the actual email log ID
      };
    } catch (error) {
      this.loggingService.error(`Failed to send test email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Validate Basic Authentication credentials
   */
  private validateBasicAuth(authHeader: string): boolean {
    if (!authHeader) {
      return false;
    }

    try {
      // Extract credentials from Authorization header
      const base64Credentials = authHeader.split(" ")[1];
      if (!base64Credentials) {
        return false;
      }

      const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
      const [username, password] = credentials.split(":");

      return username === this.webhookUsername && password === this.webhookPassword;
    } catch (error) {
      this.loggingService.error("Error validating basic auth:", error);
      return false;
    }
  }
}