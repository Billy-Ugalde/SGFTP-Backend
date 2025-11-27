import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailResult, EmailOptions } from '../interfaces/entrepreneur-notification.interface';

@Injectable()
export class EntrepreneurEmailService {
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

      console.log('✅ Servicio de email para emprendedores inicializado');

    } catch (error: any) {
      console.error('❌ Error inicializando servicio de email para emprendedores:', error.message);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Error de conexión SMTP para emprendedores:', error);
      return false;
    }
  }

  async reinitializeTransporter(): Promise<void> {
    await this.initializeTransporter();
  }

  async sendEmail(emailOptions: EmailOptions): Promise<EmailResult> {
    try {
      const result = await this.sendEmailInternal(emailOptions);
      return {
        success: true,
        messageId: result?.messageId,
        recipientEmail: emailOptions.to
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        recipientEmail: emailOptions.to
      };
    }
  }

  private async sendEmailInternal(mailOptions: any): Promise<any> {
    try {
      await this.transporter.verify();
      const result = await this.transporter.sendMail(mailOptions);
      return result;
      
    } catch (error: any) {
      try {
        await this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResult = await this.transporter.sendMail(mailOptions);
        return retryResult;
      } catch (retryError: any) {
        throw error;
      }
    }
  }

  async sendEntrepreneurRejectionEmail(
  recipientEmail: string,
  recipientName: string,
  entrepreneurName: string,
  rejectionReason: string,
  htmlContent: string
): Promise<EmailResult> {
  console.log('📧 ENTREPRENEUR-EMAIL: Iniciando sendEntrepreneurRejectionEmail');
  console.log('📨 Destinatario:', recipientEmail);
  
  try {
    if (!this.transporter) {
      console.log('🔄 Inicializando transporter...');
      await this.initializeTransporter();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const subject = `Notificación sobre su Solicitud - Fundación Tamarindo Park`;
    console.log('📝 Asunto:', subject);

    const mailOptions: EmailOptions = {
      from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    console.log('🔄 Enviando email...');
    const result = await this.sendEmail(mailOptions);
    console.log('✅ Email enviado, resultado:', result);
    
    return result;

  } catch (error: any) {
    console.error('❌ Error en sendEntrepreneurRejectionEmail:', error);
    return {
      success: false,
      error: error.message,
      recipientEmail
    };
  }
}
}