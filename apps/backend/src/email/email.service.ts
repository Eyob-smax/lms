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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4d44e3;">Welcome to the LMS Production Platform</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been invited to join the LMS Production Platform with the following assignment:</p>
        <ul>
          <li><strong>Role:</strong> ${role}</li>
          <li><strong>Department / Team:</strong> ${department || 'General Operations'}</li>
          <li><strong>Login Email:</strong> ${toEmail}</li>
          ${tempPassword ? `<li><strong>Temporary Password:</strong> <code>${tempPassword}</code></li>` : ''}
        </ul>
        <p style="margin: 24px 0;">
          <a href="${loginUrl}" style="background-color: #4d44e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Access LMS Platform Now
          </a>
        </p>
        <p style="color: #64748b; font-size: 12px;">Please change your password immediately after completing your initial login.</p>
      </div>
    `;

    const text = `Welcome to LMS Production Platform!\nHello ${name},\nYou have been invited to join as ${role} in ${department || 'General Operations'}.\nLogin Email: ${toEmail}\n${tempPassword ? `Temporary Password: ${tempPassword}\n` : ''}Access Platform: ${loginUrl}`;

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
