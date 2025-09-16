import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemplateService } from './template.service';
import { ChangeInfo, StatusEmailData, ContentChangesEmailData } from '../interfaces/notification.interface';

@Injectable()
export class NotificationService {
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
        .then(() => {
          console.log('Conexión SMTP verificada exitosamente');
        })
        .catch((error: any) => {
          console.error('Error SMTP:', error.message);
        });

    } catch (error: any) {
      console.error('Error inicializando SMTP:', error.message);
    }
  }

  async sendStatusChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    statusType: string,
    statusMessage: string
  ): Promise<void> {
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

    return await this.sendEmail(mailOptions, recipientEmail, 'ESTADO');
  }

  async sendContentChangesEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changes: ChangeInfo[]
  ): Promise<void> {
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

    return await this.sendEmail(mailOptions, recipientEmail, 'CAMBIOS CONSOLIDADOS');
  }

  async sendFairChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changeType: string,
    changeDetails: string
  ): Promise<void> {
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

  private async sendEmail(mailOptions: any, recipientEmail: string, type: string): Promise<any> {
    try {
      await this.transporter.verify();
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email ${type} enviado exitosamente a ${recipientEmail}`);
      return result;
      
    } catch (error: any) {
      console.error(`Error enviando email ${type} a ${recipientEmail}:`, error.message);
      try {
        await this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResult = await this.transporter.sendMail(mailOptions);
        console.log(`Email ${type} enviado exitosamente a ${recipientEmail} en reintento`);
        return retryResult;
      } catch (retryError: any) {
        console.error(`Falló el envío de email ${type} a ${recipientEmail} después del reintento:`, retryError.message);
        throw error;
      }
    }
  }
}