import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailPayload {
  subject: string;
  html: string;
  text?: string;
  to?: string | string[]; // Optional override, otherwise use default recipients
}

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly defaultRecipients: string[];

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.defaultRecipients = (process.env.REPORT_RECIPIENTS || '')
      .split(',')
      .map(r => r.trim())
      .filter(Boolean);
  }

  async sendMail(payload: EmailPayload): Promise<void> {
    const recipients = payload.to || this.defaultRecipients;
    if (!recipients || recipients.length === 0) {
      this.logger.error('No recipients specified for report email');
      throw new Error('No recipients specified');
    }
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: Array.isArray(recipients) ? recipients.join(',') : recipients,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      this.logger.log(`Report email sent: ${info.messageId} to ${recipients}`);
    } catch (error) {
      this.logger.error('Failed to send report email', error);
      throw error;
    }
  }
}
