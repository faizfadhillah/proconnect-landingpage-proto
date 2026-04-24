import { Injectable } from "@nestjs/common";
import axios from "axios";
import { config } from "dotenv";
import { LoggingService } from "src/logs/logs.service";
import { User } from "./entities/user.entity";
import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import * as moment from "moment-timezone";
//import { MailerService } from "./mailer.service";
import { MailjetResponse } from "./dto/mailjet-response.dto";

config();
@Injectable()
export class MailjetService {
  private logo_base64 = "https://proconnectcareer.com/logo.png";
  private readonly mailersendStatus = process.env.MAILERSEND_STATUS;

  private readonly mailjetApiUrl = "https://api.mailjet.com/v3.1/send";
  private readonly apiKey = process.env.MAILJET_API_KEY;
  private readonly secretKey = process.env.MAILJET_SECRET_KEY;
  private readonly senderEmail = process.env.MAILJET_SENDER_EMAIL;
  private readonly baseUrl =
    process.env.BASE_URL || "https://proconnectcareer.com";
  private readonly companyName = "ProConnect Career";

  private mailersend: MailerSend;

  constructor(private readonly loggingService: LoggingService) {
    this.mailersend = new MailerSend({
      apiKey:
        process.env.MAILERSEND_KEY ||
        "REDACTED_SET_ENV_MAILERSEND_KEY", // Replace with your MailerSend API key
    });
  }

  /**
   * Format date time to display with AM/PM format
   * @param dateTimeString - The date time string to format
   * @returns Formatted date time string with AM/PM
   */
  private formatDateTime(dateTimeString: string): string {
    try {
      const dateTime = moment(dateTimeString);
      if (!dateTime.isValid()) {
        return dateTimeString; // Return original if invalid
      }

      // Format: "Monday, January 15, 2024 at 2:30 PM"
      return dateTime.format("dddd, MMMM DD, YYYY [at] h:mm A");
    } catch (error) {
      this.loggingService.error(
        `Error formatting date time: ${dateTimeString}`,
        "email",
        error,
      );
      return dateTimeString; // Return original if error
    }
  }

  private formatDate(dateTimeString: string): string {
    try {
      const dateTime = moment(dateTimeString);
      if (!dateTime.isValid()) {
        return dateTimeString; // Return original if invalid
      }

      // Format: "Monday, January 15, 2024"
      return dateTime.format("dddd, MMMM DD, YYYY");
    } catch (error) {
      this.loggingService.error(
        `Error formatting date time: ${dateTimeString}`,
        "email",
        error,
      );
      return dateTimeString; // Return original if error
    }
  }

  private formatTime(dateTimeString: string): string | false {
    try {
      const dateTime = moment(dateTimeString);
      if (!dateTime.isValid()) {
        return dateTimeString; // Return original if invalid
      }

      // Check if time is 00:00 (midnight)
      /*if (dateTime.hour() === 0 && dateTime.minute() === 0) {
        return false;
      }*/

      // Format: "h:mm A"
      return dateTime.format("h:mm A");
    } catch (error) {
      this.loggingService.error(
        `Error formatting date time: ${dateTimeString}`,
        "email",
        error,
      );
      return dateTimeString; // Return original if error
    }
  }

  /**
   * Safely escape text for HTML context.
   */
  private escapeHtml(text: string): string {
    if (text == null) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Convert URLs in already-escaped text into clickable links.
   * Expects input to be HTML-escaped (no raw `<` or `>`).
   */
  private linkifyEscapedText(text: string): string {
    if (!text) return "";
    const urlRegex = /\bhttps?:\/\/[^\s]+/g;
    return text.replace(urlRegex, (url) => {
      const safeHref = url.replace(/"/g, "&quot;");
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeHref}</a>`;
    });
  }

  /**
   * Escape description and turn URLs into clickable links,
   * while preserving whitespace (used inside a pre-wrap container).
   */
  private escapeAndLinkifyDescription(description: string): string {
    const escaped = this.escapeHtml(description || "");
    return this.linkifyEscapedText(escaped);
  }

  /**
   * Check if a file URL is an image based on its extension
   */
  private isImageFile(url: string): boolean {
    if (!url) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const urlLower = url.toLowerCase();
    
    return imageExtensions.some(ext => urlLower.endsWith(ext) || urlLower.includes(ext + '?'));
  }

  /**
   * Get feedback type configuration (colors, labels, template type)
   */
  private getFeedbackTypeConfig(type: string): {
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
    templateType: 'suggestion' | 'bug' | 'complaint' | 'general';
  } {
    const upperType = type.toUpperCase();
    
    switch (upperType) {
      case 'REQUEST':
      case 'SUGGESTION':
        return {
          color: '#2563EB',
          bgColor: '#EFF6FF',
          borderColor: '#BFDBFE',
          label: 'Suggestion',
          templateType: 'suggestion',
        };
      case 'ISSUE':
        return {
          color: '#DC2626',
          bgColor: '#FEF2F2',
          borderColor: '#FECACA',
          label: 'Bug Report',
          templateType: 'bug',
        };
      case 'REQUEST_DELETION':
        return {
          color: '#D97706',
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          label: 'Complaint',
          templateType: 'complaint',
        };
      case 'GENERAL':
      default:
        return {
          color: '#059669',
          bgColor: '#ECFDF5',
          borderColor: '#A7F3D0',
          label: 'General Feedback',
          templateType: 'general',
        };
    }
  }

  /**
   * Wrap body HTML with standard ProConnect email layout
   * (logo header, container, and basic footer).
   */
  private wrapWithStandardTemplate(title: string, bodyHtml: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.escapeHtml(title)}</title>
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" alt="ProConnect Career" style="max-width:350px" />
            <h1 style="text-align:center; font-size: 20px; margin-top: 16px;">${this.escapeHtml(title)}</h1>
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            ${bodyHtml}
            <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
              ProConnect Career &mdash; Feedback notification.<br/>
              Help center: send email to <strong>cs@proconnectcareer.com</strong>.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendEmailMailjet(
    to: string,
    toName: string,
    subject: string,
    html: string,
    text: string,
    bcc: string[] = [],
    customId?: string,
  ): Promise<MailjetResponse> {
    try {
      // Build the message object
      const message: {
        From: { Email: string; Name: string };
        To: { Email: string; Name: string }[];
        Subject: string;
        TextPart: string;
        HTMLPart: string;
        Bcc?: { Email: string; Name: string }[];
        CustomID?: string;
      } = {
        From: {
          Email: this.senderEmail,
          Name: this.companyName,
        },
        To: [
          {
            Email: to,
            Name: toName,
          },
        ],
        Subject: subject,
        TextPart: text,
        HTMLPart: html,
      };

      // Add BCC if provided
      if (bcc.length > 0) {
        message.Bcc = bcc.map((email) => ({
          Email: email,
          Name: email, // Use email as name since we only have email addresses
        }));
      }

      if (customId) {
        message.CustomID = customId;
      }

      const response = await axios.post<MailjetResponse>(
        this.mailjetApiUrl,
        {
          Messages: [message],
        },
        {
          auth: {
            username: this.apiKey,
            password: this.secretKey,
          },
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      const msg = (error as any)?.response?.data ?? (error instanceof Error ? error.message : String(error));
      this.loggingService.error(
        `Mailjet API Error: ${typeof msg === "object" ? JSON.stringify(msg) : msg}`,
        "mailjet",
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error("Failed to send email");
    }
  }

  /**
   * Send feedback notification to CS.
   * Uses sendEmailMailjet. Template includes sender details and feedback content.
   * @param csEmail - CS recipient email (e.g. from config with default cs@proconnectcareer.com)
   */
  async sendFeedbackToCs(params: {
    csEmail: string;
    code: string;
    type: string;
    description: string;
    senderEmail: string;
    senderName?: string;
    senderPhone?: string;
    attachmentUrl?: string;
  }): Promise<MailjetResponse> {
    const {
      csEmail,
      code,
      type,
      description,
      senderEmail,
      senderName = "-",
      senderPhone = "-",
      attachmentUrl,
    } = params;

    const typeConfig = this.getFeedbackTypeConfig(type);
    const emailTitle = `New ${typeConfig.label}`;
    const subject = `[ProConnect Feedback] ${typeConfig.label} - #${code}`;
    const safeSenderName = this.escapeHtml(senderName);
    const safeSenderEmail = this.escapeHtml(senderEmail);
    const safeSenderPhone = this.escapeHtml(senderPhone);
    const descriptionHtml = this.escapeAndLinkifyDescription(description);

    // Build attachment HTML
    let attachmentHtml = "";
    if (attachmentUrl) {
      const href = attachmentUrl.replace(/"/g, "&quot;");
      const safeUrlLabel = this.escapeHtml(attachmentUrl);
      
      if (this.isImageFile(attachmentUrl)) {
        attachmentHtml = `
          <div style="margin-top: 20px;">
            <img src="${href}" alt="Attachment" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" />
          </div>
        `;
      } else {
        attachmentHtml = `
          <div style="margin-top: 20px;">
            <p><strong>Attachment:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #1560BD; text-decoration: none;">${safeUrlLabel.split('/').pop() || 'file'}</a></p>
          </div>
        `;
      }
    }

    // Build admin dashboard URL
    const adminDashboardUrl = `${this.baseUrl.replace(/\/$/, "")}/admin/feedbacks`;
    const safeAdminUrl = adminDashboardUrl.replace(/"/g, "&quot;");

    // Sender: tampilkan nama hanya jika beda dari email dan bukan "-" agar tidak dobel
    const showName = safeSenderName !== "-" && safeSenderName !== safeSenderEmail;

    const bodyHtml = `
      <p><strong>Feedback Code:</strong> #${this.escapeHtml(code)}</p>
      
      <p style="margin-top: 16px;"><strong>Sender</strong></p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${showName ? `<tr><td style="padding: 4px 0; width: 80px;">Nama</td><td>${safeSenderName}</td></tr>` : ""}
        <tr><td style="padding: 4px 0; width: 80px;">Email</td><td><a href="mailto:${safeSenderEmail}" style="color: #1560BD; text-decoration: none;">${safeSenderEmail}</a></td></tr>
        <tr><td style="padding: 4px 0;">Phone</td><td>${safeSenderPhone}</td></tr>
      </table>
      
      <p><strong>Feedback Content</strong></p>
      <div style="background: ${typeConfig.bgColor}; border: 1px solid ${typeConfig.borderColor}; border-radius: 8px; margin: 8px 0 20px; font-size: 14px; color: #334155; border-left: 4px solid ${typeConfig.color}; white-space: pre-wrap;">
        ${descriptionHtml}
      </div>
      
      ${attachmentHtml}
      
      <p style="margin-top: 24px; text-align: center;">
        <a href="${safeAdminUrl}" style="display: inline-block; padding: 12px 24px; background: ${typeConfig.color}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View on Feedback Dashboard →</a>
      </p>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 8px;">You can also reply directly to the user from the dashboard.</p>
    `;

    const htmlContent = this.wrapWithStandardTemplate(
      emailTitle,
      bodyHtml,
    );
    const textContent = [
      emailTitle,
      `Code: #${code}`,
      `Type: ${typeConfig.label}`,
      ``,
      `Sender Information:`,
      `Name: ${senderName}`,
      `Email: ${senderEmail}`,
      `Phone: ${senderPhone}`,
      ``,
      `Feedback Content:`,
      description,
      attachmentUrl ? `Attachment: ${attachmentUrl}` : "",
      ``,
      `View on Feedback Dashboard: ${adminDashboardUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendEmailMailjet(
      csEmail,
      "ProConnect CS",
      subject,
      htmlContent,
      textContent,
    );
  }

  /**
   * Send feedback confirmation email to user who submitted the feedback.
   * Uses User Ack template structure.
   * @param params - Feedback details and sender information
   */
  async sendFeedbackToUser(params: {
    userEmail: string;
    userName?: string;
    code: string;
    type: string;
    description: string;
    attachmentUrl?: string;
  }): Promise<MailjetResponse> {
    const {
      userEmail,
      userName = "-",
      code,
      type,
      description,
      attachmentUrl,
    } = params;

    const typeConfig = this.getFeedbackTypeConfig(type);
    const typeLabel = typeConfig.label.toLowerCase();
    const subject = `[ProConnect] We received your ${typeLabel} - #${code}`;
    const safeUserName = this.escapeHtml(userName);
    const descriptionHtml = this.escapeAndLinkifyDescription(description);

    // Build attachment HTML
    let attachmentHtml = "";
    if (attachmentUrl) {
      const href = attachmentUrl.replace(/"/g, "&quot;");
      const safeUrlLabel = this.escapeHtml(attachmentUrl);
      
      if (this.isImageFile(attachmentUrl)) {
        attachmentHtml = `
          <div style="margin-top: 20px;">
            <img src="${href}" alt="Attachment" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" />
          </div>
        `;
      } else {
        attachmentHtml = `
          <div style="margin-top: 20px;">
            <p><strong>Attachment:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #1560BD; text-decoration: none;">${safeUrlLabel.split('/').pop() || 'file'}</a></p>
          </div>
        `;
      }
    }

    // Build body HTML – struktur sederhana, content tetap
    const bodyHtml = `
      <p><strong>Your Reference Code:</strong> #${this.escapeHtml(code)}</p>
      
      <p style="margin-top: 16px;">
        Hi <strong>${safeUserName}</strong>,<br><br>
        Thank you for taking the time to share your ${typeLabel} with us. Your input is valuable and helps us make ProConnect better for everyone in the ASEAN hospitality community.
      </p>
      
      <p style="margin-top: 20px;"><strong>What Happens Next</strong></p>
      <ol style="margin: 8px 0 20px; padding-left: 20px; line-height: 1.6;">
        <li><strong>Logged & Categorized</strong> — Your ${typeLabel} has been recorded and assigned to the right team.</li>
        <li><strong>Under Review</strong> — Our team will review your submission within 1–3 business days.</li>
        <li><strong>Follow-Up</strong> — If we need more details, we'll reach out. Otherwise, you'll see improvements reflected in future updates.</li>
      </ol>
      
      <p style="background: #EBF2FB; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #0E4A94; margin: 16px 0;">
        💡 Have more feedback or found an issue? You can submit anytime through the platform.
      </p>
      
      ${attachmentHtml}
      
      <p style="margin-top: 24px; text-align: center;">
        <a href="${this.baseUrl.replace(/\/$/, "")}/admin/feedbacks" style="display: inline-block; padding: 12px 24px; background: #1560BD; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Submit More Feedback</a>
      </p>
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 8px;">Or visit our <a href="${this.baseUrl.replace(/\/$/, "")}/help" style="color: #1560BD; text-decoration: none; font-weight: 600;">Help Center</a> for FAQs and guides.</p>
    `;

    const htmlContent = this.wrapWithStandardTemplate(
      "We Received Your Feedback!",
      bodyHtml,
    );
    const textContent = [
      `We Received Your ${typeConfig.label}!`,
      ``,
      `Hi ${userName},`,
      `Thank you for taking the time to share your ${typeLabel} with us. Your input is valuable and helps us make ProConnect better for everyone in the ASEAN hospitality community.`,
      ``,
      `Your Reference Code: #${code}`,
      ``,
      `What Happens Next:`,
      `1. Logged & Categorized — Your ${typeLabel} has been recorded and assigned to the right team.`,
      `2. Under Review — Our team will review your submission within 1–3 business days.`,
      `3. Follow-Up — If we need more details, we'll reach out. Otherwise, you'll see improvements reflected in future updates.`,
      ``,
      `Have more feedback or found an issue? You can submit anytime through the platform.`,
      attachmentUrl ? `Attachment: ${attachmentUrl}` : "",
      ``,
      `Submit More Feedback: ${this.baseUrl.replace(/\/$/, "")}/admin/feedbacks`,
      `Help Center: ${this.baseUrl.replace(/\/$/, "")}/help`,
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendEmailMailjet(
      userEmail,
      userName || userEmail,
      subject,
      htmlContent,
      textContent,
    );
  }

  async sendEmail(
    to: string,
    toName: string,
    subject: string,
    html: string,
    text: string,
    bcc: string[] = [],
  ) {
    if (this.mailersendStatus == "true") {
      const recipients = [new Recipient(to, toName)];

      const emailParams = new EmailParams()
        .setFrom(
          new Sender(
            process.env.MAILERSEND_EMAIL || "proconnectjob@fivestarstudio.id",
            "ProConnect Career",
          ),
        )
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(html)
        .setText(text);

      if (bcc.length > 0) {
        emailParams.setBcc(bcc.map((email) => new Recipient(email)));
      }

      try {
        await this.mailersend.email.send(emailParams);
        return {
          message: `Default credentials sent successfully to ${to}`,
        };
      } catch (error) {
        this.loggingService.error(
          `An error occurred sent email to ${to}`,
          "email",
          error,
        );

        return { message: error };
      }
    } else {
      // Use the new sendEmailMailjet method with DTO response
      return await this.sendEmailMailjet(to, toName, subject, html, text, bcc);
    }
  }

  async sendOtp(user: User, otp: string) {
    const subject = "[ProConnect] Your Email Verification OTP Code";
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[ProConnect] Your Email Verification OTP Code</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://proconnectcareer.com/logo.png" style="max-width:350px" />
            <h1 style="text-align:center">OTP Verification</h1>            
          </div>
          <div font-size: 13px; line-height: 1.5; color: #333333; text-align: left; >
            <p>Hello ${user.email},</p>
            <p>To complete your email verification, please use the following OTP Code:</p>
            <p style="text-align:center"><a style="font-size: 24px; font-weight: bold; border-radius: 8px; background:#eee; padding:10px 30px;">${otp}</a></p>
            <p>This code is valid for 5 minutes.</p>
            <p>Please secure your account and do not share this OTP Code with any other parties</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>Need help? Contact our support team at <strong>cs@proconnectcareer.com.</strong></p>
            <p></p>
            <p>Thank you for using ProConnect Career.</p>
          </div>          
        </div>
      </body>
      </html>
    `;
    const textContent = `Hello ${user.email},\n\no complete your email verification, please use the following OTP Code: ${otp}\n\nThis code is valid for 5 minutes.\n\nPlease secure your account and do not share this OTP Code with any other partiesPlease secure your account and do not share this OTP Code with any other parties\n\nIf you did not request this verification, please ignore this email.\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nThank you for using ProConnect Career.`;

    try {
      await this.sendEmail(
        user.email,
        user.full_name || user.email,
        subject,
        htmlContent,
        textContent,
      );
      //this.loggingService.log(`otp sent successfully to `, "email");
      return { message: "OTP sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sent otp to ${user.email}`,
        "email",
        error.stack,
      );
      //throw new BadGatewayException(error);
      return { message: error };
    }
  }

  // 1 Otp Registration
  async publicSendOtp(email: string, otp: string) {
    const subject = "Your OTP Code for Registration";
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your OTP Code for Registration</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">OTP Verification</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${email},</p>
            <p>Please use the following OTP code to complete your registration: <strong>${otp}</strong>.</p>
            <p>This OTP is valid for 5 minutes.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;
    const textContent = `Hello ${email},\n\nPlease use the following OTP code to complete your registration: ${otp}.\n\nThis OTP is valid for 5 minutes.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(email, email, subject, htmlContent, textContent);
      //this.loggingService.log(`otp sent successfully to `, "email");
      return { message: "OTP sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred send otp to ${email}`,
        "email",
        error.stack,
      );
      //throw new BadGatewayException(error);
      return { message: error };
    }
  }

  // 2 Update Password
  async sendPasswordResetEmail(user: User, resetPasswordLink: string) {
    const subject = "Password Update Confirmation";
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Update Confirmation</title>     
    </head>
    <body>
      <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${this.logo_base64}" style="max-width:350px" />
          <h1>Password Update</h1>          
        </div>
        <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
          <p>Hello ${user.full_name || user.email},</p>
          <p>Your password has been successfully updated. If you did not initiate this change, please contact our support immediately.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetPasswordLink}" style="background-color: #2d5fb7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </p>
          <p>Regards,<br>ProConnect Team</p>
        </div>        
      </div>
    </body>
    </html>
  `;

    const textContent = `Hello ${user.full_name || user.email},\n\nYour password has been successfully updated. If you did not initiate this change, please contact our support immediately.\n\nRegards,\nProConnect Team`;
    try {
      await this.sendEmail(
        user.email,
        user.full_name || user.email,
        subject,
        htmlContent,
        textContent,
      );
      /*this.loggingService.log(
        `password reset sent successfully to ${user.email}`,
        "email",
      );*/
      return {
        message: "Password update confirmation email sent successfully",
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sent password update confirmation to ${user.email}`,
        "email",
        error.stack,
      );
      //throw new BadGatewayException(error);
      return { message: error.stack };
    }
  }

  // 3 Change User Roles
  async sendCompanyRoleChange(user: User, newRole: string) {
    const subject = "Your User Role has Changed";
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your User Role has Changed</title>     
    </head>
    <body>
      <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${this.logo_base64}" style="max-width:350px" />
          <h1>User Role Change</h1>          
        </div>
        <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
          <p>Hello ${user.full_name || user.email},</p>
          <p>Your user role has been updated to <strong>${newRole}</strong>. Please log in to view your updated access rights.</p>
          <p>Regards,<br>ProConnect Team</p>
        </div>        
      </div>
    </body>
    </html>
  `;

    const textContent = `Hello ${user.full_name || user.email},\n\nYour user role has been updated to ${newRole}. Please log in to view your updated access rights.\n\nRegards,\nProConnect Team`;
    try {
      await this.sendEmail(
        user.email,
        user.full_name || user.email,
        subject,
        htmlContent,
        textContent,
      );

      return { message: "User role change email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sent user role change to ${user.email}`,
        "email",
        error.stack,
      );
      //throw new BadGatewayException(error);
      return { message: error.stack };
    }
  }

  // 4 Invote Employer Staf
  async sendDefaultCredentials(
    user: User,
    defaultUsername: string,
    defaultPassword: string,
    company: MstCompany,
  ) {
    const subject = `[ProConnect] Welcome to ${company.company_name} – Here's Your Login Details`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[ProConnect] Welcome to ${company.company_name} – Here's Your Login Details</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Login Details</h1> 
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello User</p>
            <p style="line-height:2">You have been added as a member of ${company.company_name} ${company.branch}. Here's you default login details:</p>
            <p><ul style="line-height:2"><li>Email: ${defaultUsername}</li><li>Password: ${defaultPassword}</li></ul></p>
            <p>For security purposes, please update your password after you log in for the first time at ProConnect.</p>
            <p>If you did not request this verification, please ignore this email.</p>
            <p>Need help? Contact our support team at <strong>cs@proconnectcareer.com.</strong></p>
            <p>Thank you for using ProConnect Career.</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello User,\n\n
    You have been added as a member of ${company.company_name} ${company.branch}. Here's you default login details:\n\n
    Username: ${defaultUsername}\n
    Password: ${defaultPassword}\n\n
    For security purposes, please update your password after you log in for the first time at ProConnect.\n\n
    If you did not request this verification, please ignore this email.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Thank you for using ProConnect Career.`;

    try {
      await this.sendEmail(
        user.email,
        user.full_name || user.email,
        subject,
        htmlContent,
        textContent,
      );
      /*this.loggingService.log(
        `Default credentials sent successfully to ${user.email}`,
        "email",
      );*/
      return { message: "Default credentials sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred send default credential to ${user.email}`,
        "email",
        error.stack,
      );
      //throw new BadGatewayException(error);
      return { message: error.stack };
    }
  }

  // 5 Submitted Application
  async sendJobApplicationReceived(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    bccEmails: string[] = [],
  ) {
    const subject = `Job Application Received for ${jobTitle} at ${employerName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Application Received for ${jobTitle} at ${employerName}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Application Received</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${employerName}</strong>. Your application has been received and is now under review.</p>
            <p>We will keep you updated on the progress of your application.</p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Thank you for applying for the ${jobTitle} position at ${employerName}. Your application has been received and is now under review.\n\n
    We will keep you updated on the progress of your application.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
        bccEmails,
      );
      return { message: "Job application received email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending job application received email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 6 Shortlist accepted (candidate)
  async sendShortlistAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
  ) {
    const subject = `Congratulations! You've Been Shortlisted for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations! You've Been Shortlisted for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Congratulations!</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Congratulations! Your application for the position <strong>${jobTitle}</strong> at <strong>${employerName}</strong> has been shortlisted.</p>
            <p>Please await further instructions.</p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Congratulations! Your application for the position ${jobTitle} at ${employerName} has been shortlisted.\n\n
    Please await further instructions.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Shortlist accepted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending shortlist accepted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 7 View Questionnaire (candidate)
  async sendViewQuestionnaire(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    questionnaireLink: string,
  ) {
    const subject = `Action Required: Complete Your Questionnaire for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Action Required: Complete Your Questionnaire for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Questionnaire Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Please complete your questionnaire for the position <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${questionnaireLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Questionnaire</a></p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Please complete your questionnaire for the position ${jobTitle} at ${employerName}.\n\n
    Access it here: ${this.baseUrl}${questionnaireLink}\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "View questionnaire email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending view questionnaire email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 8 Questionnaaire Accepted (candidate)
  async sendQuestionnaireSubmitted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
  ) {
    const subject = `Questionnaire Successfully Submitted for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Questionnaire Successfully Submitted for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Questionnaire Submitted</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Thank you for submitting your questionnaire for <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p>We will review your responses and update you soon.</p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Thank you for submitting your questionnaire for ${jobTitle} at ${employerName}.\n\n
    We will review your responses and update you soon.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Questionnaire submitted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending questionnaire submitted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 9 Questionnaire Accepted (Candidate)
  async sendQuestionnaireAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
  ) {
    const subject = `Questionnaire for ${jobTitle} Accepted!`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Questionnaire for ${jobTitle} Accepted!</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Questionnaire Accepted!</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Great news! Your questionnaire for <strong>${jobTitle}</strong> at <strong>${employerName}</strong> has been accepted. We will reach out soon with the next steps.</p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nGreat news! Your questionnaire for ${jobTitle} at ${employerName} has been accepted. We will reach out soon with the next steps.\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Questionnaire accepted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending questionnaire accepted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 10 Questionnaire Needs Revision (Candidate)
  async sendQuestionnaireNeedsRevision(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    questionnaireLink: string,
  ) {
    const subject = `Revision Required: Questionnaire for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Revision Required: Questionnaire for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Revision Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Please revise your questionnaire for <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${questionnaireLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Questionnaire</a></p>                        
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nPlease revise your questionnaire for ${jobTitle} at ${employerName}. Access it here: ${this.baseUrl}${questionnaireLink}\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Questionnaire revision email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending questionnaire revision email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 11 View Data Fulfillment (Candidate)
  async sendViewDataFulfillment(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    dataFulfillmentLink: string,
  ) {
    const subject = `Action Required: Complete Your Data Fulfillment for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Action Required: Complete Your Data Fulfillment for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Data Fulfillment Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Please complete your data fulfillment for <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${dataFulfillmentLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Data Fulfillment</a></p>                        
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nPlease complete your data fulfillment for ${jobTitle} at ${employerName}. Access it here: ${this.baseUrl}${dataFulfillmentLink}\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "View data fulfillment email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending view data fulfillment email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 12 Data Fulfillment Submitted (Candidate)
  async sendDataFulfillmentSubmitted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
  ) {
    const subject = `Data Fulfillment for ${jobTitle} Successfully Submitted`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Data Fulfillment for ${jobTitle} Successfully Submitted</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Data Submitted Successfully</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Your data for <strong>${jobTitle}</strong> has been successfully submitted and is under review.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nYour data for ${jobTitle} has been successfully submitted and is under review.\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Data fulfillment submitted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending data fulfillment submitted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 13 Data Fulfillment Accepted (Candidate)
  async sendDataFulfillmentAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
  ) {
    const subject = `Data Fulfillment for ${jobTitle} Accepted`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Data Fulfillment for ${jobTitle} Accepted</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Data Fulfillment Accepted</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Your submitted data for <strong>${jobTitle}</strong> at <strong>${employerName}</strong> has been accepted. Further updates will follow soon.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nYour submitted data for ${jobTitle} at ${employerName} has been accepted. Further updates will follow soon.\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Data fulfillment accepted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending data fulfillment accepted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 14 Data Fulfillment Needs Revision (Candidate)
  async sendDataFulfillmentNeedsRevision(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    dataFulfillmentLink: string,
  ) {
    const subject = `Revision Required: Data Fulfillment for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Revision Required: Data Fulfillment for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Revision Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Please revise your data submission for <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${dataFulfillmentLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Data Fulfillment</a></p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nPlease revise your data submission for ${jobTitle} at ${employerName} here: ${this.baseUrl}${dataFulfillmentLink}\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Data fulfillment revision email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending data fulfillment revision email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 15 Interview: After Set Schedule (Offline Interview)
  async sendInterviewScheduleOffline(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    scheduledDateTime: string,
    location: string,
    country: string,
    city: string,
    postalCode: string,
    mapsLink: string,
    interviewDescription: string,
    interviewLink: string,
    bccEmails: string[] = [],
  ) {
    const formattedDate = this.formatDate(scheduledDateTime);
    const formattedTime = this.formatTime(scheduledDateTime);
    const subject = `${candidateName} Interview Schedule Confirmation for ${jobTitle} at ${brandName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${candidateName} Interview Schedule Confirmation for ${jobTitle} at ${brandName}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Interview Confirmed</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Your interview for <strong>${jobTitle}</strong> at <strong>${brandName}</strong> has been confirmed for:</p>
            <p><strong>Date:</strong> ${formattedDate}<br>
            ${formattedTime ? `<strong>Time:</strong> Check in the interview detail on the application.<br>` : ``}
            <strong>Interview Type:</strong> Offline<br>
            <strong>Location:</strong> ${location}, ${country}, ${city}, ${postalCode}<br>
            ${mapsLink ? `<strong>Maps Link:</strong> <a href="${mapsLink}" style="color: rgb(249, 0, 145);">${mapsLink}</a><br>` : ``}
            <strong>Description:</strong> ${interviewDescription}</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${interviewLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Full Interview Details</a></p>  
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nYour interview for ${jobTitle} at ${brandName} has been confirmed for:\nDate: ${formattedDate}\n${formattedTime ? `Time: Check in the interview detail on the application.\n` : ``}Interview Type: Offline\nLocation: ${location}, ${country}, ${city}, ${postalCode}\n${mapsLink ? `Maps Link: ${mapsLink}\n` : ``}Description: ${interviewDescription}\n\nAccess Full Interview Details here: ${this.baseUrl}${interviewLink}\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
        bccEmails,
      );
      return { message: "Interview schedule offline email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview schedule offline email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 16 Interview: After Set Schedule (Online Interview)
  async sendInterviewScheduleOnline(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    scheduledDateTime: string,
    onlineMeetingLink: string,
    interviewDescription: string,
    interviewLink: string,
    bccEmails: string[] = [],
  ) {
    const formattedDate = this.formatDate(scheduledDateTime);
    const formattedTime = this.formatTime(scheduledDateTime);
    const subject = `${candidateName} Interview Schedule Confirmation for ${jobTitle} at ${brandName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${candidateName} Interview Schedule Confirmation for ${jobTitle} at ${brandName}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Interview Confirmed</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Your interview for <strong>${jobTitle}</strong> at <strong>${brandName}</strong> has been confirmed for:</p>
            <p><strong>Date:</strong> ${formattedDate}<br>
            ${formattedTime ? `<strong>Time:</strong> Check in the interview detail on the application.<br>` : ``}
            <strong>Interview Type:</strong> Online<br>
            <strong>Online Meeting Link:</strong> <a href="${onlineMeetingLink}" style="color: rgb(249, 0, 145);">${onlineMeetingLink}</a><br>
            <strong>Description:</strong> ${interviewDescription}</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${interviewLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Full Interview Details</a></p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nYour interview for ${jobTitle} at ${brandName} has been confirmed for:\nDate: ${formattedDate}\n${formattedTime ? `Time: Check in the interview detail on the application.\n` : ``}Interview Type: Online\nOnline Meeting Link: ${onlineMeetingLink}\nDescription: ${interviewDescription}\n\nAccess Full Interview Details here: ${this.baseUrl}${interviewLink}\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
        bccEmails,
      );
      return { message: "Interview schedule online email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview schedule online email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 17 Interview: Reschedule Request Sent
  async sendInterviewRescheduleRequestSent(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    rescheduleNotes: string,
    interviewLink: string,
    bccEmails: string[] = [],
  ) {
    const subject = `Interview Reschedule Request for ${jobTitle} at ${brandName} Sent`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Reschedule Request for ${jobTitle} at ${brandName} Sent</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Reschedule Request Sent</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>We've received your request to reschedule the interview for the position <strong>${jobTitle}</strong> with <strong>${brandName}</strong>. We'll inform you as soon as the employer responds.</p> 
            <p>Reason for Reschedule: <strong>${rescheduleNotes}</strong></p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${interviewLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Full Interview Details</a></p>            
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>  
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nWe've received your request to reschedule the interview for the position ${jobTitle} with ${brandName}. We'll inform you as soon as the employer responds.\n\n${rescheduleNotes}\n\nAccess Full Interview Details here: ${this.baseUrl}${interviewLink}\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
        bccEmails,
      );
      return {
        message: "Interview reschedule request sent email sent successfully",
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview reschedule request sent email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 18 Interview: Reschedule Approved (Offline Interview)
  async sendInterviewRescheduleApprovedOffline(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    newScheduledDateTime: string,
    location: string,
    country: string,
    city: string,
    postalCode: string,
    mapsLink: string,
    interviewDescription: string,
    interviewLink: string,
    bccEmails: string[] = [],
  ) {
    const formattedDate = this.formatDate(newScheduledDateTime);
    const formattedTime = this.formatTime(newScheduledDateTime);
    const subject = `Interview Reschedule for ${jobTitle} Approved`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Reschedule for ${jobTitle} Approved</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Reschedule Approved</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Your request to reschedule your interview for <strong>${jobTitle}</strong> with <strong>${brandName}</strong> has been approved. The new schedule is:</p>
            <p><strong>Date:</strong> ${formattedDate}<br>
            ${formattedTime ? `<strong>Time:</strong> Check in the interview detail on the application.<br>` : ``}
            <strong>Interview Type:</strong> Offline<br>
            <strong>Location:</strong> ${location}, ${country}, ${city}, ${postalCode}<br>
            ${mapsLink ? `<strong>Maps Link:</strong> <a href="${mapsLink}" style="color: rgb(249, 0, 145);">${mapsLink}</a><br>` : ``}
            <strong>Description:</strong> ${interviewDescription}</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${interviewLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Access Full Interview Details</a></p>
            <p>Best regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nYour request to reschedule your interview for ${jobTitle} with ${brandName} has been approved. The new schedule is:\nDate: ${formattedDate}\n${formattedTime ? `Time: Check in the interview detail on the application.\n` : ``}Interview Type: Offline\nLocation: ${location}, ${country}, ${city}, ${postalCode}\n${mapsLink ? `Maps Link: ${mapsLink}\n` : ``}Description: ${interviewDescription}\n\nAccess Full Interview Details here: ${this.baseUrl}${interviewLink}\n\nBest regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
        bccEmails,
      );
      return {
        message:
          "Interview reschedule approved offline email sent successfully",
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview reschedule approved offline email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 19 Interview: Reschedule Approved (Online Interview)
  async sendInterviewRescheduleApprovedOnline(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    newScheduledDateTime: string,
    onlineMeetingLink: string,
    interviewDescription: string,
    interviewLink: string,
    bccEmails: string[] = [],
  ) {
    const formattedDate = this.formatDate(newScheduledDateTime);
    const formattedTime = this.formatTime(newScheduledDateTime);
    const subject = `Interview Reschedule for ${jobTitle} Approved`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Reschedule for ${jobTitle} Approved</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Reschedule Approved</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Your request to reschedule your interview for <strong>${jobTitle}</strong> with <strong>${brandName}</strong> has been approved. The new schedule is:</p>
            <p><strong>Date:</strong> ${formattedDate}<br>
            ${formattedTime ? `<strong>Time:</strong> Check in the interview detail on the application.<br>` : ``}
            <strong>Interview Type:</strong> Online<br>
            <strong>Online Meeting Link:</strong> <a href="${onlineMeetingLink}" style="color: rgb(249, 0, 145);">${onlineMeetingLink}</a><br>
            <strong>Description:</strong> ${interviewDescription}</p>
            <p style="text-align:center"><a href="${this.baseUrl}${interviewLink}" style="display: inline-block; padding: 15px 25px; font-size: 18px; font-weight: bold; color: #ffffff!important; background-color:rgb(249, 0, 145); border-radius: 8px; text-decoration: none;">Access Full Interview Details</a></p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nYour request to reschedule your interview for ${jobTitle} with ${brandName} has been approved. The new schedule is:\nDate: ${formattedDate}\n${formattedTime ? `Time: Check in the interview detail on the application.\n` : ``}Interview Type: Online\nOnline Meeting Link: ${onlineMeetingLink}\nDescription: ${interviewDescription}\n\nAccess Full Interview Details here: ${this.baseUrl}${interviewLink}\n\nNeed help? Contact our support team at cs@proconnectcareer.com.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
        bccEmails,
      );
      return {
        message: "Interview reschedule approved online email sent successfully",
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview reschedule approved online email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 20 Interview: Reschedule Rejected
  async sendInterviewRescheduleRejected(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    interviewLink: string,
  ) {
    const subject = `Interview Reschedule Request for ${jobTitle} Rejected`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Reschedule Request for ${jobTitle} Rejected</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Reschedule Request Rejected</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>We regret to inform you that your request to reschedule the interview for <strong>${jobTitle}</strong> with <strong>${brandName}</strong> has been declined. Please attend at the original time.</p>
            <p style="text-align:center"><a href="${this.baseUrl}${interviewLink}" style="display: inline-block; padding: 15px 25px; font-size: 18px; font-weight: bold; color: #ffffff!important; background-color:rgb(249, 0, 145); border-radius: 8px; text-decoration: none;">Access Full Interview Details</a></p>
            <p>Thank you for understanding,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nWe regret to inform you that your request to reschedule the interview for ${jobTitle} with ${brandName} has been declined. Please attend at the original time.\n\nAccess Full Interview Details here: ${this.baseUrl}${interviewLink}\n\nThank you for understanding,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return {
        message: "Interview reschedule rejected email sent successfully",
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview reschedule rejected email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 21 Interview Result: Accepted
  async sendInterviewResultAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
  ) {
    const subject = `Congratulations! Interview for ${jobTitle} Passed`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations! Interview for ${jobTitle} Passed</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Congratulations!</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Congratulations! You have successfully passed the interview for the position <strong>${jobTitle}</strong> at <strong>${brandName}</strong>. The employer will reach out shortly regarding the next steps.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nCongratulations! You have successfully passed the interview for the position ${jobTitle} at ${brandName}. The employer will reach out shortly regarding the next steps.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Interview result accepted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview result accepted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 22 Hired Notification: Accepted
  async sendHiredNotificationAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    startDate?: string,
    description?: string,
    attachment?: string,
  ) {
    const subject = `Congratulations, Your Job Offer for ${jobTitle} at ${brandName} has been Accepted`;

    // Format start date if provided
    let formattedStartDate = "Not specified";
    if (startDate) {
      try {
        const date = new Date(startDate);
        formattedStartDate = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch (e) {
        formattedStartDate = startDate;
      }
    }

    // Build details section
    let detailsSection = "";
    if (startDate || description || attachment) {
      const detailsItems = [];

      if (startDate) {
        detailsItems.push(`
          <li style="margin-bottom: 10px;">
            <strong>Start Date:</strong> ${formattedStartDate}
          </li>
        `);
      }

      if (description) {
        detailsItems.push(`
          <li style="margin-bottom: 10px;">
            <strong>Description:</strong><br>
            <div style="margin-top: 5px; white-space: pre-wrap; color: #555555;">${description}</div>
          </li>
        `);
      }

      if (attachment) {
        detailsItems.push(`
          <li style="margin-bottom: 10px;">
            <strong>Attachment:</strong><br>
            <a href="${this.baseUrl}${attachment}" style="color: #2d5fb7; text-decoration: none; font-weight: bold;" target="_blank">View Attachment</a>
          </li>
        `);
      }

      if (detailsItems.length > 0) {
        detailsSection = `
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333333; font-size: 16px;">Employment Notes:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${detailsItems.join("")}
            </ul>
          </div>
        `;
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations, Your Job Offer for ${jobTitle} at ${brandName} has been Accepted</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Congratulations!</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Fantastic news! <strong>${brandName}</strong> has confirmed your hiring for the <strong>${jobTitle}</strong> role. Congratulations and good luck in your new role!</p>
            ${detailsSection}
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    // Build text content
    let textDetails = "";
    if (startDate || description || attachment) {
      const textItems = [];
      if (startDate) {
        textItems.push(`Start Date: ${formattedStartDate}`);
      }
      if (description) {
        textItems.push(`Description: ${description}`);
      }
      if (attachment) {
        textItems.push(`Attachment: ${this.baseUrl}${attachment}`);
      }

      if (textItems.length > 0) {
        textDetails = "\n\nEmployment Notes:\n" + textItems.join("\n");
      }
    }

    const textContent = `Hello ${candidateName},\n\nFantastic news! ${brandName} has confirmed your hiring for the ${jobTitle} role. Congratulations and good luck in your new role!${textDetails}\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Hired notification accepted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending hired notification accepted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 23 Hired Notification: Rejected
  async sendHiredNotificationRejected(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
  ) {
    const subject = `Update on Your Application for ${jobTitle} at ${brandName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Update on Your Application for ${jobTitle} at ${brandName}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Application Update</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${brandName}</strong> and for taking the time to apply.</p>
            <p>After careful consideration, we regret to inform you that your application was not successful on this occasion. We appreciate your effort and interest in joining <strong>${brandName}</strong> team.</p>
            <p>We encourage you to apply for future opportunities that match your skills and experience. We wish you all the best in your job search.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\nThank you for your interest in the ${jobTitle} position at ${brandName} and for taking the time to apply.\n\nAfter careful consideration, we regret to inform you that your application was not successful on this occasion. We appreciate your effort and interest in joining ${brandName} team.\n\nWe encourage you to apply for future opportunities that match your skills and experience. We wish you all the best in your job search.\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Hired notification rejected email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending hired notification rejected email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 24 Interview: Set Schedule (Employer)
  async sendInterviewSetScheduleEmployer(
    employerEmails: string[],
    candidateName: string,
    jobTitle: string,
    brandName: string,
    setScheduleLink: string,
  ) {
    const subject = `Action Required: Set ${candidateName} Schedule Interview for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Action Required: Set ${candidateName} Schedule Interview for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
              <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Action Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${brandName} Team,</p>
            <p>Please set the interview schedule for <strong>${candidateName}</strong> applying for the <strong>${jobTitle}</strong> role at <strong>${brandName}</strong>.</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${setScheduleLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">Set Schedule Here</a></p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${brandName} Team,\n\nPlease set the interview schedule for ${candidateName} applying for the ${jobTitle} role at ${brandName}.\n\nSet schedule here: ${this.baseUrl}${setScheduleLink}\n\nRegards,\nProConnect Team`;

    try {
      // Send to first employer email (primary recipient)
      if (employerEmails.length > 0) {
        await this.sendEmail(
          employerEmails[0],
          `${brandName} Team`,
          subject,
          htmlContent,
          textContent,
        );
      }
      return {
        message: "Interview set schedule employer email sent successfully",
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending interview set schedule employer email`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 25 Move Candidate
  async sendMoveCandidateStage(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    brandName: string,
    newStage: string,
    candidateProfileLink: string,
  ) {
    const subject = `Candidate ${candidateName} Moved to ${newStage} for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Candidate ${candidateName} Moved to ${newStage} for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
                <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Candidate Status Update</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p><strong>${candidateName}</strong> has been moved to the following stage in your recruitment pipeline for <strong>${jobTitle}</strong> at <strong>${brandName}</strong>:</p>
            <p><strong>New Stage:</strong> ${newStage}</p>
            <p style="font-weight:bold">Access it here : <a href="${this.baseUrl}${candidateProfileLink}" style="font-weight: bold; text-decoration: none; color:#2d5fb7">View Candidate Profile</a></p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n${candidateName} has been moved to the following stage in your recruitment pipeline for ${jobTitle} at ${brandName}:\n\nNew Stage: ${newStage}\n\nView candidate profile: ${this.baseUrl}${candidateProfileLink}\n\nRegards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Move candidate stage email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending move candidate stage email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 26 View Test (Candidate)
  async sendViewTestPsycho(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    testLink: string,
  ) {
    const subject = `Action Required: Complete Your Test Submission for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Action Required: Complete Your Test Submission for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Test Submission Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Please complete your test submission for the position <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p>Access it here: <a href="${this.baseUrl}${testLink}" style="color: #3498db; text-decoration: none;">Access Test Submission</a></p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Please complete your test submission for the position ${jobTitle} at ${employerName}.\n\n
    Access it here: ${this.baseUrl}${testLink}. Access Test Submission\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "View test email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending view test email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 27 Test Submitted (Candidate)
  async sendTestPsychoSubmitted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
  ) {
    const subject = `Test Successfully Submitted for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Successfully Submitted for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Test Submitted</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Thank you for submitting your test submission for <strong>${jobTitle}</strong>. We will review your responses and update you soon.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Thank you for submitting your test submission for ${jobTitle}. We will review your responses and update you soon.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Test submitted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending test submitted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 28 Test Accepted (Candidate)
  async sendTestPsychoAccepted(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
  ) {
    const subject = `Test Submission for ${jobTitle} Accepted!`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Submission for ${jobTitle} Accepted!</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Test Accepted</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Great news! Your test submission for <strong>${jobTitle}</strong> at <strong>${employerName}</strong> has been accepted. We will reach out soon with the next steps.</p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Great news! Your test submission for ${jobTitle} at ${employerName} has been accepted. We will reach out soon with the next steps.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Test accepted email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending test accepted email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 29 Test Needs Revision (Candidate)
  async sendTestPsychoNeedsRevision(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    employerName: string,
    testLink: string,
  ) {
    const subject = `Revision Required: Test Submission for ${jobTitle}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Revision Required: Test Submission for ${jobTitle}</title>        
      </head>
      <body>
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Test Revision Required</h1>            
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #333333; text-align: left;">
            <p>Hello ${candidateName},</p>
            <p>Please revise your test submission for <strong>${jobTitle}</strong> at <strong>${employerName}</strong>.</p>
            <p>Access it here: <a href="${this.baseUrl}${testLink}" style="color: #3498db; text-decoration: none;">Access Test Submission</a></p>
            <p>Regards,<br>ProConnect Team</p>
          </div>          
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${candidateName},\n\n
    Please revise your test submission for ${jobTitle} at ${employerName}.\n\n
    Access it here: ${this.baseUrl}${testLink}. Access Test Submission\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Regards,\nProConnect Team`;

    try {
      await this.sendEmail(
        candidateEmail,
        candidateName,
        subject,
        htmlContent,
        textContent,
      );
      return { message: "Test needs revision email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending test needs revision email to ${candidateEmail}`,
        "email",
        error.stack,
      );
      return { message: error.stack };
    }
  }

  // 30 Invite Candidate
  async sendInviteCandidate(
    user: User,
    defaultUsername: string,
    defaultPassword: string,
    emailLogId: string
  ): Promise<MailjetResponse> {
    const baseUrl = process.env.PROCONNECT_LOGIN_URL ?? "https://proconnectcareer.com/login";

    const subject = "[ProConnect] Welcome to ProConnect Career – Here's Your Login Details";
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[ProConnect] Welcome to ProConnect Career – Here's Your Login Details</title>
      </head>
      <body>
        <div style="width:100%;max-width:600px;margin:0 auto;background-color:#ffffff;padding:20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align:center;margin-bottom:20px;">
            <img src="${this.logo_base64}" style="max-width:350px" />
            <h1 style="text-align:center">Welcome to ProConnect Career</h1>
          </div>
          <div style="font-size:13px;line-height:1.6;color:#333;text-align:left;">
            <p>Hello ${user.full_name || 'User'},</p>
            <p style="line-height:2">
              Welcome to ProConnect Career! Here are your login details:
            </p>
            <ul style="line-height:2">
              <li>Email: <strong>${defaultUsername}</strong></li>
              <li>Password: <strong>${defaultPassword}</strong></li>
            </ul>
            <p>For security purposes, please update your password after logging in for the first time.</p>

            <p style="text-align:center;margin:24px 0;">
              <a href="${baseUrl}"
                style="background-color:#0069d9;color:#fff;padding:12px 24px;
                        text-decoration:none;border-radius:6px;display:inline-block;">
                Go to Login Page
              </a>
            </p>

            <p style="text-align:center;margin:24px 0;">
              <a href="https://play.google.com/store/apps/details?id=com.proconnectjob&hl=en"
                style="background-color:#34a853;color:#fff;padding:12px 24px;
                        text-decoration:none;border-radius:6px;display:inline-block;">
                Download Android App
              </a>
            </p>

            <p>If you did not request this account, please ignore this email.</p>
            <p>Need help? Contact our support team at <strong>cs@proconnectcareer.com</strong>.</p>
            <p>Thank you for joining ProConnect Career.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Hello ${user.full_name || 'User'},\n\n
    Welcome to ProConnect Career! Here are your login details:\n\n
    Email: ${defaultUsername}\n
    Password: ${defaultPassword}\n\n
    You can log in here: ${baseUrl}\n\n
    For security purposes, please update your password after you log in for the first time.\n\n
    If you did not request this account, please ignore this email.\n\n
    Need help? Contact our support team at cs@proconnectcareer.com.\n\n
    Thank you for joining ProConnect Career.`;

    try {
      const response = await this.sendEmailMailjet(
        user.email,
        user.full_name || user.email,
        subject,
        htmlContent,
        textContent,
        [],
        emailLogId
      );
      this.loggingService.log(`Successfully sent invitation email to ${user.email} | response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.loggingService.error(
        `An error occurred sending invitation email to ${user.email}`,
        "email",
        error.stack,
      );
      return {
        Messages: [
          {
            Status: "error",
            Errors: [
              {
                ErrorIdentifier: "mailjet-error",
                ErrorCode: "mailjet-error",
                StatusCode: 500,
                ErrorMessage: error.stack,
                ErrorRelatedTo: ["mailjet-error"],
              },
            ],
          },
        ],
      }
    }
  }
}
