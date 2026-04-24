import { ApiProperty } from "@nestjs/swagger";

export class MailjetWebhookEventDto {
  @ApiProperty({
    description: "Event type (sent, open, click, bounce, etc.)",
    example: "sent",
  })
  event: string;

  @ApiProperty({
    description: "Unix timestamp of the event",
    example: 1704115200,
  })
  time: number;

  @ApiProperty({
    description: "Mailjet's internal message ID",
    example: "123456789",
  })
  MessageID: string;

  @ApiProperty({
    description: "Recipient email address",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Custom ID from our system (email_log_id)",
    example: "123e4567-e89b-12d3-a456-426614174000",
    required: false,
  })
  CustomID?: string;

  @ApiProperty({
    description: "Mailjet campaign ID",
    example: "campaign-123",
    required: false,
  })
  mj_campaign_id?: string;

  @ApiProperty({
    description: "Mailjet contact ID",
    example: "contact-123",
    required: false,
  })
  mj_contact_id?: string;

  @ApiProperty({
    description: "Payload data",
    example: "custom-data",
    required: false,
  })
  payload?: string;

  @ApiProperty({
    description: "Custom campaign identifier",
    example: "welcome-email",
    required: false,
  })
  customcampaign?: string;
}

export class MailjetSentEventDto extends MailjetWebhookEventDto {
  @ApiProperty({
    description: "SMTP server reply",
    example: "250 OK",
    required: false,
  })
  smtp_reply?: string;
}

export class MailjetOpenEventDto extends MailjetWebhookEventDto {
  @ApiProperty({
    description: "IP address of the user",
    example: "192.168.1.1",
    required: false,
  })
  ip?: string;

  @ApiProperty({
    description: "Geographic location",
    example: "US",
    required: false,
  })
  geo?: string;

  @ApiProperty({
    description: "User agent string",
    example: "Mozilla/5.0...",
    required: false,
  })
  agent?: string;
}

export class MailjetClickEventDto extends MailjetWebhookEventDto {
  @ApiProperty({
    description: "URL that was clicked",
    example: "https://example.com/link",
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: "IP address of the user",
    example: "192.168.1.1",
    required: false,
  })
  ip?: string;

  @ApiProperty({
    description: "Geographic location",
    example: "US",
    required: false,
  })
  geo?: string;

  @ApiProperty({
    description: "User agent string",
    example: "Mozilla/5.0...",
    required: false,
  })
  agent?: string;
}

export class MailjetBounceEventDto extends MailjetWebhookEventDto {
  @ApiProperty({
    description: "Whether the email was blocked",
    example: false,
    required: false,
  })
  blocked?: boolean;

  @ApiProperty({
    description: "Whether it's a hard bounce",
    example: true,
    required: false,
  })
  hard_bounce?: boolean;

  @ApiProperty({
    description: "What the error is related to",
    example: "recipient",
    required: false,
  })
  error_related_to?: string;

  @ApiProperty({
    description: "Error message",
    example: "user unknown",
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: "Additional error comment",
    example: "The recipient does not exist",
    required: false,
  })
  comment?: string;
}

export class MailjetSpamEventDto extends MailjetWebhookEventDto {
  @ApiProperty({
    description: "Source of the spam report",
    example: "feedback-loop",
    required: false,
  })
  source?: string;
}

export class MailjetUnsubEventDto extends MailjetWebhookEventDto {
  @ApiProperty({
    description: "Mailjet list ID",
    example: "list-123",
    required: false,
  })
  mj_list_id?: string;

  @ApiProperty({
    description: "IP address of the user",
    example: "192.168.1.1",
    required: false,
  })
  ip?: string;

  @ApiProperty({
    description: "Geographic location",
    example: "US",
    required: false,
  })
  geo?: string;

  @ApiProperty({
    description: "User agent string",
    example: "Mozilla/5.0...",
    required: false,
  })
  agent?: string;
}

export class TestSendEmailDto {
  @ApiProperty({
    description: "Email address to send test email to",
    example: "test@example.com",
  })
  email: string;
}