// mailgun.service.ts
import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class MailgunService {
  private readonly apiKey =
    process.env.MAILGUN_API_KEY || "REDACTED_SET_ENV_MAILGUN_API_KEY"; // Ganti dengan API Key Mailgun
  private readonly domain =
    process.env.MAILGUN_DOMAIN || "REDACTED_SET_ENV_MAILGUN_DOMAIN"; // Ganti dengan domain Mailgun Anda

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggingService,
  ) {}

  async sendEmail(to: string, subject: string, text: string) {
    const url = `https://api.mailgun.net/v3/${this.domain}/messages`;

    const data = new URLSearchParams({
      from: `Excited User <postmaster@${this.domain}>`,
      to,
      subject,
      text,
    });

    const headers = {
      Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
        "mailgun",
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
