import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailProviderService {
  private transporter: any;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASS'),
        },
      });

      this.transporter.verify().catch((error: any) => {
        console.error('[EmailProvider] SMTP verify error:', error.message);
      });
    } catch (error: any) {
      console.error('[EmailProvider] Init error:', error.message);
    }
  }

  async sendMail(options: MailOptions): Promise<void> {
    if (!this.transporter) {
      await this.initializeTransporter();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const mailOptions = {
      from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) await this.initializeTransporter();
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  classifyError(error: any): 'temporary' | 'permanent' {
    const message: string = (error?.message || '').toLowerCase();
    const responseCode: number = error?.responseCode || error?.code;

    const permanentCodes = [550, 551, 552, 553, 554];
    const temporaryCodes = [421, 450, 451, 452];

    if (typeof responseCode === 'number') {
      if (permanentCodes.includes(responseCode)) return 'permanent';
      if (temporaryCodes.includes(responseCode)) return 'temporary';
    }

    const permanentKeywords = [
      'mailbox not found',
      'user unknown',
      'no such user',
      'does not exist',
      'invalid address',
      'enotfound',
    ];

    if (permanentKeywords.some((k) => message.includes(k))) return 'permanent';

    const temporaryKeywords = [
      'econnrefused',
      'etimedout',
      'econnreset',
      'esocket',
      'connection',
      'timeout',
    ];

    if (temporaryKeywords.some((k) => message.includes(k))) return 'temporary';

    return 'temporary';
  }
}
