import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
}

export interface SentEmailLog {
  id: string;
  to: string | string[];
  subject: string;
  content: string;
  sentAt: Date;
  status: 'SMTP' | 'CONSOLE_FALLBACK';
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any = null;
  private sentLogs: SentEmailLog[] = [];

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);

    if (host && user && pass) {
      try {
        // Dynamically load nodemailer so the app builds cleanly even if not installed
        const nodemailer = require('nodemailer');
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        this.logger.log(`SMTP Email Transporter initialized (${host}:${port})`);
      } catch (error) {
        this.logger.warn('SMTP configured but nodemailer package not found or failed to init. Using Console Fallback.');
        this.transporter = null;
      }
    } else {
      this.logger.log('SMTP credentials not fully configured. Email Service will use Console Fallback mode.');
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId: string; mode: 'SMTP' | 'CONSOLE_FALLBACK' }> {
    const from = this.configService.get<string>('SMTP_FROM', 'noreply@lms-platform.local');
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const bodyContent = options.html || options.text || 'No content provided';
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Try SMTP first if available
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: recipients,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        this.logger.log(`Email successfully dispatched via SMTP to [${recipients}]. MessageID: ${info.messageId}`);
        this.recordLog(messageId, recipients, options.subject, bodyContent, 'SMTP');
        return { success: true, messageId: info.messageId || messageId, mode: 'SMTP' };
      } catch (smtpError: any) {
        this.logger.error(`SMTP Send failed: ${smtpError.message}. Reverting to Console Fallback.`);
      }
    }

    // Console Fallback Mode (Guarantee delivery logging in dev/docker environments)
    this.logToConsole(from, recipients, options.subject, bodyContent);
    this.recordLog(messageId, recipients, options.subject, bodyContent, 'CONSOLE_FALLBACK');

    return { success: true, messageId, mode: 'CONSOLE_FALLBACK' };
  }

  async sendInvitationEmail(toEmail: string, name: string, role: string, department: string, tempPassword?: string, inviteLink?: string) {
    const subject = `Welcome to LMS Production Platform - Invitation to join as ${role}`;
    const loginUrl = inviteLink || 'http://localhost:3000/login';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4d44e3; margin-top: 0;">Welcome to the LMS Production Platform</h2>
        <p style="color: #334155; font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #334155; font-size: 15px;">You have been invited to join the LMS Production Platform with the following assignment:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <ul style="margin: 0; padding-left: 20px; color: #334155;">
            <li style="margin-bottom: 8px;"><strong>Role:</strong> ${role}</li>
            <li style="margin-bottom: 8px;"><strong>Department / Team:</strong> ${department || 'General Operations'}</li>
            <li style="margin-bottom: 8px;"><strong>Login Email:</strong> ${toEmail}</li>
            ${tempPassword ? `<li><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></li>` : ''}
          </ul>
        </div>
        <p style="margin: 28px 0; text-align: center;">
          <a href="${loginUrl}" style="background-color: #4d44e3; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(77, 68, 227, 0.2);">
            ${inviteLink || !tempPassword ? 'Create Password & Activate Account' : 'Access LMS Platform Now'}
          </a>
        </p>
        ${inviteLink ? `<p style="color: #64748b; font-size: 13px; margin-top: 24px; word-break: break-all;">If the button above does not work, copy and paste this verification link into your browser:<br/><a href="${loginUrl}" style="color: #4d44e3;">${loginUrl}</a></p>` : ''}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Please activate your account and set your password to begin learning.</p>
      </div>
    `;

    const text = `Welcome to LMS Production Platform!\nHello ${name},\nYou have been invited to join as ${role} in ${department || 'General Operations'}.\nLogin Email: ${toEmail}\n${tempPassword ? `Temporary Password: ${tempPassword}\n` : ''}Activate Account: ${loginUrl}`;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(toEmail: string, resetToken: string, resetUrl?: string) {
    const subject = 'Password Reset Request - LMS Production Platform';
    const link = resetUrl || `http://localhost:3000/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4d44e3;">Password Reset Request</h2>
        <p>We received a request to reset the password for your LMS account (<strong>${toEmail}</strong>).</p>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background-color: #4d44e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p style="color: #64748b; font-size: 12px;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    const text = `Password Reset Request for ${toEmail}\nClick the following link to reset your password (expires in 1 hour):\n${link}`;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
      text,
    });
  }

  getSentLogs(): SentEmailLog[] {
    return this.sentLogs;
  }

  clearSentLogs(): void {
    this.sentLogs = [];
  }

  private logToConsole(from: string, to: string, subject: string, content: string) {
    const separator = '='.repeat(80);
    const subSeparator = '-'.repeat(80);
    const cleanContent = content.replace(/<[^>]*>?/gm, '').trim();

    console.log(`\n${separator}`);
    console.log(`📧 [LMS EMAIL SERVICE - CONSOLE FALLBACK DISPATCH]`);
    console.log(subSeparator);
    console.log(`FROM:    ${from}`);
    console.log(`TO:      ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(subSeparator);
    console.log(`MESSAGE BODY:\n${cleanContent || content}`);
    console.log(`${separator}\n`);
  }

  private recordLog(id: string, to: string, subject: string, content: string, status: 'SMTP' | 'CONSOLE_FALLBACK') {
    this.sentLogs.unshift({
      id,
      to,
      subject,
      content,
      sentAt: new Date(),
      status,
    });
    // Keep max 100 recent logs in memory
    if (this.sentLogs.length > 100) {
      this.sentLogs.pop();
    }
  }
}
