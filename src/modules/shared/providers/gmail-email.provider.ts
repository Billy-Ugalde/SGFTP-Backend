import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GmailEmailProvider {
   private transporter: any;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
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

      this.transporter.verify()
        .then(() => {
        })
        .catch((error: any) => {
          console.error('Error SMTP:', error.message);
        });

    } catch (error: any) {
      console.error('Error inicializando SMTP:', error.message);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await this.transporter.verify();
      
      const mailOptions = {
        from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[GmailProvider] Email enviado a: ${to}`);
      
    } catch (error: any) {
      console.error('[GmailProvider] Error enviando:', error.message);
      throw new Error('No se pudo enviar el email');
    }
  }
}