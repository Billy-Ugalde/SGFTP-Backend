import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChangeInfo {
  field: string;
  oldValue: string;
  newValue: string;
  description: string;
}

@Injectable()
export class NotificationService {
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
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusType}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8fafc;
          }
          
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #2c5530 0%, #3d7340 100%);
            padding: 40px 30px;
            text-align: center;
          }
          
          .logo h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .logo p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
          }
          
          .content {
            padding: 30px 25px;
          }
          
          .greeting {
            font-size: 16px;
            margin-bottom: 30px;
            color: #34495e;
          }
          
          .status-alert {
            background: ${statusBgColor};
            border: 2px solid ${statusColor};
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          
          .status-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
          }
          
          .status-title {
            color: ${statusColor};
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .fair-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #3498db;
          }
          
          .fair-name {
            color: #2c5530;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 15px;
          }
          
          .status-message {
            color: #5a6c7d;
            font-size: 16px;
            line-height: 1.7;
            margin: 0;
          }
          
          .important-note {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #f39c12;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
          }
          
          .important-note p {
            color: #856404;
            font-size: 14px;
            font-weight: 500;
            margin: 0;
          }
          
          .footer {
            background: #f8fafc;
            border-top: 1px solid #e9ecef;
            padding: 30px;
            text-align: center;
          }
          
          .footer-content {
            color: #6c757d;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .footer-title {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
          }
          
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
            margin: 25px 0;
          }
          
          @media (max-width: 600px) {
            .email-container {
              margin: 20px;
              border-radius: 12px;
            }
            
            .header {
              padding: 30px 20px;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .status-title {
              font-size: 20px;
            }
            
            .fair-name {
              font-size: 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <h1>Fundación Tamarindo Park</h1>
              <p>Sistema de Gestión de Ferias</p>
            </div>
          </div>
          
          <div class="content">
            <p class="greeting">Estimado/a <strong>${recipientName}</strong>,</p>
            
            <div class="status-alert">
              <span class="status-icon">${statusIcon}</span>
              <h2 class="status-title">${statusType}</h2>
            </div>
            
            <div class="fair-info">
              <h3 class="fair-name">🎪 ${fairName}</h3>
              <p class="status-message">${statusMessage}</p>
            </div>
            
            <div class="important-note">
              <p><strong>💡 Importante:</strong> Te contactaremos con información adicional muy pronto. Mantente atento a futuras comunicaciones.</p>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 15px; color: #5a6c7d; line-height: 1.6;">
              Si tienes alguna pregunta o consulta, no dudes en contactarnos. Estamos aquí para apoyarte.
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <p class="footer-title">Fundación Tamarindo Park</p>
              <p>Sistema Automatizado de Notificaciones</p>
              <p style="margin-top: 10px; font-size: 12px; color: #95a5a6;">
                Este es un mensaje automático, por favor no responder a este correo.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

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
    
    const getFieldIcon = (field: string): string => {
      const icons: { [key: string]: string } = {
        'Nombre de la Feria': '🏷️',
        'Descripción': '📝',
        'Fecha': '📅',
        'Ubicación': '📍',
        'Condiciones': '📋',
        'Tipo de Feria': '🏪',
        'Capacidad de Stands': '🏬'
      };
      return icons[field] || '📄';
    };

    const changesHtml = changes.map((change, index) => `
      <tr style="border-bottom: 1px solid #e9ecef;">
        <td style="padding: 15px 10px; vertical-align: top; width: 40px;">
          <span style="font-size: 20px;">${getFieldIcon(change.field)}</span>
        </td>
        <td style="padding: 15px 10px; vertical-align: top;">
          <div>
            <h4 style="margin: 0 0 8px 0; color: #2c5530; font-size: 16px; font-weight: 600;">${change.field}</h4>
            <div style="margin-bottom: 5px;">
              <span style="color: #6c757d; font-size: 13px; font-weight: 500;">Anterior:</span>
              <span style="color: #dc3545; font-size: 14px; margin-left: 5px;">${change.oldValue}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <span style="color: #6c757d; font-size: 13px; font-weight: 500;">Nuevo:</span>
              <span style="color: #28a745; font-size: 14px; font-weight: 500; margin-left: 5px;">${change.newValue}</span>
            </div>
            <p style="margin: 0; color: #5a6c7d; font-size: 12px; font-style: italic;">${change.description}</p>
          </div>
        </td>
      </tr>
    `).join('');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualizaciones de Feria</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8fafc;
          }
          
          .email-container {
            max-width: 650px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #2c5530 0%, #3d7340 100%);
            padding: 40px 30px;
            text-align: center;
          }
          
          .logo h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .logo p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
          }
          
          .content {
            padding: 30px 25px;
          }
          
          .greeting {
            font-size: 16px;
            margin-bottom: 25px;
            color: #34495e;
          }
          
          .intro-text {
            font-size: 15px;
            color: #34495e;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          
          .changes-summary {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border: 2px solid #2196f3;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
          }
          
          .changes-count {
            color: #1565c0;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }
          
          .reminder-box {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #f39c12;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
          }
          
          .reminder-box p {
            color: #856404;
            font-size: 15px;
            font-weight: 500;
            margin: 0;
            line-height: 1.6;
          }
          
          .footer {
            background: #f8fafc;
            border-top: 1px solid #e9ecef;
            padding: 30px;
            text-align: center;
          }
          
          .footer-content {
            color: #6c757d;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .footer-title {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
          }
          
          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
            margin: 25px 0;
          }
          
          @media (max-width: 650px) {
            .email-container {
              margin: 20px;
              border-radius: 12px;
            }
            
            .header {
              padding: 30px 20px;
            }
            
            .content {
              padding: 25px 20px;
            }
            
            .changes-count {
              font-size: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <h1>Fundación Tamarindo Park</h1>
              <p>Sistema de Gestión de Ferias</p>
            </div>
          </div>
          
          <div class="content">
            <p class="greeting">Estimado/a <strong>${recipientName}</strong>,</p>
            
            <p class="intro-text">
              Hemos realizado las siguientes actualizaciones en la feria <strong>"${fairName}"</strong>. A continuación te detallamos los cambios:
            </p>
            
            <div class="changes-summary">
              <span style="font-size: 24px; display: block; margin-bottom: 5px;">📄</span>
              <h3 class="changes-count">${changes.length} Cambio${changes.length > 1 ? 's' : ''} Realizado${changes.length > 1 ? 's' : ''}</h3>
            </div>
            
            <div style="background: #ffffff; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                ${changesHtml}
              </table>
            </div>
            
            <div class="reminder-box">
              <p><strong>📌 Importante:</strong> Revisa estos cambios y ajusta tus planes según sea necesario.</p>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 15px; color: #5a6c7d; line-height: 1.6;">
              Para cualquier consulta sobre estos cambios, puedes contactarnos.
            </p>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <p class="footer-title">Fundación Tamarindo Park</p>
              <p>Sistema Automatizado de Notificaciones</p>
              <p style="margin-top: 10px; font-size: 12px; color: #95a5a6;">
                Este es un mensaje automático, por favor no responder a este correo.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

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