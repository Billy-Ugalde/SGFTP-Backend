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
    console.log('Inicializando NotificationService...');
    this.initializeTransporter();
  }

  private initializeTransporter() {
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
          console.log('Servidor SMTP listo para enviar emails');
        })
        .catch((error: any) => {
          console.error('Error de configuración SMTP:', error.message);
        });

    } catch (error: any) {
      console.error('Error inicializando SMTP:', error.message);
    }
  }

  //MÉTODO PARA CAMBIOS DE ESTADO (Cancelación/Reactivación)
  async sendStatusChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    statusType: string,
    statusMessage: string
  ): Promise<void> {
    console.log(`\n=== ENVIANDO EMAIL DE ESTADO ===`);
    console.log(`Tipo: ${statusType}`);
    console.log(`Destinatario: ${recipientEmail}`);

    if (!this.transporter) {
      this.initializeTransporter();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const subject = `IMPORTANTE - ${statusType}: ${fairName}`;
    
    // Color según el tipo de cambio
    const statusColor = statusType.includes('Cancelada') ? '#dc3545' : '#28a745';
    const statusIcon = statusType.includes('Cancelada') ? '❌' : '✅';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2c5530;">
          <h2 style="color: #2c5530; margin: 0;">Fundación Tamarindo Park</h2>
        </div>
        
        <div style="padding: 30px 0;">
          <p style="font-size: 16px; color: #333;">Estimado/a <strong>${recipientName}</strong>,</p>
          
          <div style="background-color: ${statusColor}; color: white; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">${statusIcon} ${statusType}</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 25px 0;">
            <h3 style="margin-top: 0; margin-bottom: 15px; color: #2c5530; font-size: 18px;">Feria: "${fairName}"</h3>
            <p style="margin-bottom: 0; color: #495057; font-size: 16px; line-height: 1.6;">${statusMessage}</p>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Cualquier consulta, no dudes en contactarnos.
          </p>
        </div>
        
        <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center;">
          <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
            <strong>Fundación Tamarindo Park</strong><br>
            Sistema de notificaciones
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    return await this.sendEmail(mailOptions, recipientEmail, 'ESTADO');
  }

  //MÉTODO PARA CAMBIOS DE CONTENIDO CONSOLIDADOS
  async sendContentChangesEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changes: ChangeInfo[]
  ): Promise<void> {
    console.log(`\n=== ENVIANDO EMAIL CONSOLIDADO ===`);
    console.log(`Total cambios: ${changes.length}`);
    console.log(`Destinatario: ${recipientEmail}`);

    if (!this.transporter) {
      this.initializeTransporter();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const subject = `Actualizaciones en feria: ${fairName}`;
    
    // Generar HTML para cada cambio
    const changesHtml = changes.map(change => `
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; border-radius: 4px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #2c5530; font-size: 16px;">📝 ${change.field}</h4>
        <p style="margin: 8px 0; color: #495057; font-size: 14px;"><strong>Antes:</strong> ${change.oldValue}</p>
        <p style="margin: 8px 0; color: #495057; font-size: 14px;"><strong>Ahora:</strong> ${change.newValue}</p>
        <p style="margin-bottom: 0; color: #6c757d; font-size: 13px; font-style: italic;">${change.description}</p>
      </div>
    `).join('');
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #2c5530;">
          <h2 style="color: #2c5530; margin: 0;">Fundación Tamarindo Park</h2>
        </div>
        
        <div style="padding: 30px 0;">
          <p style="font-size: 16px; color: #333;">Estimado/a <strong>${recipientName}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Te informamos que se han realizado actualizaciones en la feria <strong>"${fairName}"</strong>:
          </p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0; color: #1565c0; font-size: 18px;">🔄 ${changes.length} Cambio${changes.length > 1 ? 's' : ''} Detectado${changes.length > 1 ? 's' : ''}</h3>
          </div>
          
          ${changesHtml}
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 25px 0; border: 1px solid #ffeaa7;">
            <p style="margin: 0; color: #856404; font-size: 14px; text-align: center;">
              <strong>💡 Recuerda:</strong> Revisa estos cambios y ajusta tus planes según sea necesario.
            </p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center;">
          <p style="color: #6c757d; font-size: 12px; margin: 5px 0;">
            <strong>Fundación Tamarindo Park</strong><br>
            Sistema de notificaciones
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: this.configService.get('EMAIL_FROM'),
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    return await this.sendEmail(mailOptions, recipientEmail, 'CAMBIOS CONSOLIDADOS');
  }

  //MÉTODO ORIGINAL
  async sendFairChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changeType: string,
    changeDetails: string
  ): Promise<void> {
    console.log(`\n=== ENVIANDO EMAIL INDIVIDUAL (LEGACY) ===`);
    console.log(`Tipo: ${changeType}`);
    console.log(`Destinatario: ${recipientEmail}`);

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

  // MÉTODO AUXILIAR PARA ENVÍO
  private async sendEmail(mailOptions: any, recipientEmail: string, type: string): Promise<any> {
    console.log(`Configuración del email ${type}:`);
    console.log(`- From: ${mailOptions.from}`);
    console.log(`- To: ${mailOptions.to}`);
    console.log(`- Subject: ${mailOptions.subject}`);

    try {
      console.log('Verificando transporter...');
      await this.transporter.verify();
      console.log('Transporter verificado OK');

      console.log(`Enviando email ${type}...`);
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`\n=== RESULTADO ${type} ===`);
      console.log('- Message ID:', result.messageId);
      console.log('- Response:', result.response);
      console.log(`✅ EMAIL ${type} ENVIADO EXITOSAMENTE a: ${recipientEmail}`);
      
      return result;
      
    } catch (error: any) {
      console.error(`\n❌ ERROR EN ENVÍO ${type}:`);
      console.error('- Message:', error.message || 'No message');
      console.error('- Code:', error.code || 'No code');
      
      // Reintentar una vez
      try {
        console.log(`\n🔄 REINTENTANDO ENVÍO ${type}...`);
        this.initializeTransporter();
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResult = await this.transporter.sendMail(mailOptions);
        console.log(`✅ REINTENTO ${type} EXITOSO para: ${recipientEmail}`);
        return retryResult;
      } catch (retryError: any) {
        console.error(`❌ REINTENTO ${type} FALLÓ: ${retryError.message}`);
        throw error;
      }
    }
  }
}