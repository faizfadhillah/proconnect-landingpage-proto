import { Injectable } from "@nestjs/common";
import { Recipient, EmailParams, MailerSend, Sender } from "mailersend";
import { User } from "./entities/user.entity";
import { LoggingService } from "src/logs/logs.service";
import { config } from "dotenv";

config();
@Injectable()
export class MailerService {
  private mailersend: MailerSend;

  constructor(private readonly loggingService: LoggingService) {
    this.mailersend = new MailerSend({
      apiKey:
        process.env.MAILERSEND_KEY ||
        "REDACTED_SET_ENV_MAILERSEND_KEY", // Replace with your MailerSend API key
    });
  }

  async sendEmail(
    recipientEmail: string,
    recipientName: string,
    subject: string,
    htmlContent: string,
    textContent: string,
  ) {
    const recipients = [new Recipient(recipientEmail, recipientName)];

    const emailParams = new EmailParams()
      .setFrom(
        new Sender(
          process.env.MAILERSEND_EMAIL || "proconnectjob@fivestarstudio.id",
          "Proconnect Job",
        ),
      )
      .setTo(recipients) // Correct method to add recipients
      .setSubject(subject)
      .setHtml(htmlContent)
      .setText(textContent);

    try {
      await this.mailersend.email.send(emailParams); // Ensure 'email' property is used to access send method
      return {
        message: `Default credentials sent successfully to ${recipientEmail}`,
      };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sent email to ${recipientEmail}`,
        "email",
        error,
      );
      //throw new BadGatewayException(error);
      return { message: error };
    }
  }

  async sendOtp(user: User, otp: string) {
    const subject = "Your OTP Code";
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .email-header { text-align: center; margin-bottom: 20px; }
          .email-header h1 { color: #2c3e50; }
          .email-body { font-size: 16px; line-height: 1.5; color: #333333; text-align: left; }
          .otp-code { display: inline-block; padding: 15px 25px; font-size: 24px; font-weight: bold; color: #fff; background-color: #2ecc71; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999999; }
          .footer a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Asean ProConnect</h1>
            <p>OTP Verification</p>
          </div>
          <div class="email-body">
            <p>Hi ${user.full_name || user.email},</p>
            <p>Thank you for using Asean ProConnect. To verify your email address, please use the OTP code below:</p>
            <div class="otp-code">${otp}</div>
            <p>This code is valid for 5 minutes only. If you didn't request this OTP, please ignore this message.</p>
            <p>Best regards,</p>
            <p><strong>Asean ProConnect Team</strong></p>
          </div>
          <div class="footer">
            <p>If you have any questions, feel free to contact us at <a href="mailto:support@aseanproconnect.com">support@aseanproconnect.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Hi ${user.full_name || user.email},\n\nYour OTP code is: ${otp}\n\nThis code is valid for 5 minutes only.\n\nBest regards,\nAsean ProConnect Team`;

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

  async publicSendOtp(email: string, otp: string) {
    const subject = "Your OTP Code";
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .email-header { text-align: center; margin-bottom: 20px; }
          .email-header h1 { color: #2c3e50; }
          .email-body { font-size: 16px; line-height: 1.5; color: #333333; text-align: left; }
          .otp-code { display: inline-block; padding: 15px 25px; font-size: 24px; font-weight: bold; color: #fff; background-color: #2ecc71; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999999; }
          .footer a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Asean ProConnect</h1>
            <p>OTP Verification</p>
          </div>
          <div class="email-body">
            <p>Hi ${email},</p>
            <p>Thank you for using Asean ProConnect. To verify your email address, please use the OTP code below:</p>
            <div class="otp-code">${otp}</div>
            <p>This code is valid for 5 minutes only. If you didn't request this OTP, please ignore this message.</p>
            <p>Best regards,</p>
            <p><strong>Asean ProConnect Team</strong></p>
          </div>
          <div class="footer">
            <p>If you have any questions, feel free to contact us at <a href="mailto:support@aseanproconnect.com">support@aseanproconnect.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Hi ${email},\n\nYour OTP code is: ${otp}\n\nThis code is valid for 5 minutes only.\n\nBest regards,\nAsean ProConnect Team`;

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

  async sendDefaultCredentials(
    user: User,
    defaultUsername: string,
    defaultPassword: string,
  ) {
    const subject = "Your Default Username and Password";
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Default Credentials</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .email-header { text-align: center; margin-bottom: 20px; }
          .email-header h1 { color: #2c3e50; }
          .email-body { font-size: 16px; line-height: 1.5; color: #333333; text-align: left; }
          .credentials { display: inline-block; padding: 15px; font-size: 18px; font-weight: bold; color: #000; background-color: #d3d3d3; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999999; }
          .footer a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Asean ProConnect</h1>
            <p>Your Default Credentials</p>
          </div>
          <div class="email-body">
            <p>Hi ${user.full_name || user.email},</p>
            <p>Welcome to Asean ProConnect! Below are your default username and password:</p>
            <div class="credentials">Email: ${defaultUsername}</div>
            <div class="credentials">Password: ${defaultPassword}</div>
            <p>Please change your password after logging in for security reasons.</p>
            <p>Best regards,</p>
            <p><strong>Asean ProConnect Team</strong></p>
          </div>
          <div class="footer">
            <p>If you have any questions, feel free to contact us at <a href="mailto:support@aseanproconnect.com">support@aseanproconnect.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Hi ${user.full_name || user.email},\n\nWelcome to Asean ProConnect! Below are your default username and password:\n\nUsername: ${defaultUsername}\nPassword: ${defaultPassword}\n\nPlease change your password after logging in for security reasons.\n\nBest regards,\nAsean ProConnect Team`;

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

  async sendPasswordResetEmail(user: User, resetPasswordLink: string) {
    const subject = "Password Reset Request";
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
        .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .email-header { text-align: center; margin-bottom: 20px; }
        .email-header h1 { color: #2c3e50; }
        .email-body { font-size: 16px; line-height: 1.5; color: #333333; text-align: left; }
        .reset-button { display: inline-block; padding: 15px 25px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #3498db; border-radius: 8px; text-decoration: none; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999999; }
        .footer a { color: #3498db; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Asean ProConnect</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="email-body">
          <p>Hi ${user.full_name || user.email},</p>
          <p>We received a request to reset your password. Click the button below to reset your password:</p>
          <a href="${resetPasswordLink}" class="reset-button">Reset Password</a>
          <p>If you did not request a password reset, please ignore this email or contact support if you have any questions.</p>
          <p>Best regards,</p>
          <p><strong>Asean ProConnect Team</strong></p>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to contact us at <a href="mailto:support@aseanproconnect.com">support@aseanproconnect.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    const textContent = `Hi ${user.full_name || user.email},\n\nWe received a request to reset your password. Click the link below to reset your password:\n\n${resetPasswordLink}\n\nIf you did not request a password reset, please ignore this email or contact support if you have any questions.\n\nBest regards,\nAsean ProConnect Team`;
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
      return { message: "Password reset email sent successfully" };
    } catch (error) {
      this.loggingService.error(
        `An error occurred sent reset password to ${user.email}`,
        "email",
        error.stack,
      );
      //throw new BadGatewayException(error);
      return { message: error.stack };
    }
  }
}
