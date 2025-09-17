import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import { 
  ChangeInfo, 
  StatusEmailData, 
  ContentChangesEmailData,
  NewFairEmailData, 
  EmailResult,
  EmailOptions
} from '../interfaces/notification.interface';
import { INotificationService } from '../interfaces/notification-service.interface';

@Injectable()
export class NotificationService implements INotificationService {
  private transporter: any;

  constructor(
    private configService: ConfigService,
    private templateService: TemplateService
  ) {
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
        .catch((error: any) => {
          console.error('❌ Error SMTP:', error.message);
        });

    } catch (error: any) {
      console.error('❌ Error inicializando SMTP:', error.message);
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
      console.error('❌ Error de conexión SMTP:', error);
      return false;
    }
  }

  async reinitializeTransporter(): Promise<void> {
    await this.initializeTransporter();
  }

  async sendStatusChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    statusType: string,
    statusMessage: string
  ): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const subject = `IMPORTANTE - ${statusType}: ${fairName}`;
      
      const isCancellation = statusType.includes('Cancelada');
      const statusColor = isCancellation ? '#e74c3c' : '#27ae60';
      const statusIcon = isCancellation ? '⚠️' : '✅';
      const statusBgColor = isCancellation ? '#fdeeee' : '#edf7ed';
      
      const emailData: StatusEmailData = {
        recipientName,
        fairName,
        statusType,
        statusMessage,
        statusColor,
        statusIcon,
        statusBgColor
      };

      const htmlContent = this.templateService.generateStatusChangeEmail(emailData);

      const mailOptions = {
        from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      };

      const result = await this.sendEmailInternal(mailOptions, recipientEmail);
      return {
        success: true,
        messageId: result?.messageId,
        recipientEmail
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        recipientEmail
      };
    }
  }

  async sendContentChangesEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changes: ChangeInfo[]
  ): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const subject = `Actualizaciones en feria: ${fairName}`;
      
      const emailData: ContentChangesEmailData = {
        recipientName,
        fairName,
        changes
      };

      const htmlContent = this.templateService.generateContentChangesEmail(emailData);

      const mailOptions = {
        from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      };

      const result = await this.sendEmailInternal(mailOptions, recipientEmail);
      return {
        success: true,
        messageId: result?.messageId,
        recipientEmail
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        recipientEmail
      };
    }
  }

  async sendNewFairEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDescription: string,
    fairDate: string,
    fairLocation: string,
    fairType: string,
    standCapacity: number,
    conditions: string
  ): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const subject = `¡Nueva Feria Disponible! ${fairName}`;
      
      const emailData: NewFairEmailData = {
        recipientName,
        fairName,
        fairDescription,
        fairDate,
        fairLocation,
        fairType,
        standCapacity,
        conditions
      };

      const htmlContent = this.templateService.generateNewFairEmail(emailData);

      const mailOptions = {
        from: `"Fundación Tamarindo Park" <${this.configService.get('EMAIL_FROM')}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      };

      const result = await this.sendEmailInternal(mailOptions, recipientEmail);
      return {
        success: true,
        messageId: result?.messageId,
        recipientEmail
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        recipientEmail
      };
    }
  }

  async sendFairChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changeType: string,
    changeDetails: string
  ): Promise<EmailResult> {
    if (changeType.includes('Cancelada') || changeType.includes('Reactivada')) {
      return await this.sendStatusChangeEmail(recipientEmail, recipientName, fairName, changeType, changeDetails);
    } else {
      const changes: ChangeInfo[] = [{
        field: changeType,
        oldValue: 'Valor anterior',
        newValue: 'Nuevo valor',
        description: changeDetails
      }];
      return await this.sendContentChangesEmail(recipientEmail, recipientName, fairName, changes);
    }
  }

  async sendEmail(emailOptions: EmailOptions): Promise<EmailResult> {
    try {
      const result = await this.sendEmailInternal(emailOptions, emailOptions.to);
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

  private async sendEmailInternal(mailOptions: any, recipientEmail: string): Promise<any> {
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
}