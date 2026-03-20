import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { Entrepreneur } from 'src/modules/entrepreneurs/entities/entrepreneur.entity';
import {
  BatchEmailResult,
  ServiceResponse,
} from '../interfaces/entrepreneur-notification.interface';
import { IEntrepreneurNotificationService } from '../interfaces/entrepreneur-notification-service.interface';
import { EmailQueueService } from '../../shared/email/services/email-queue.service';
import { EmailTemplateService } from '../../shared/email/services/email-template.service';

const REJECTION_STYLES = `
  .rej-header { text-align: center; padding: 20px 0 8px; }
  .rej-icon { font-size: 34px; display: block; margin-bottom: 10px; }
  .rej-title { color: #3D3935; font-size: 20px; font-weight: 700; margin-bottom: 0; }
  .rej-name { color: #0A4558; font-size: 18px; font-weight: 700; margin: 16px 0 4px; }
  .rej-message { color: #3D3935; font-size: 15px; line-height: 1.7; margin: 12px 0; }
  .rej-reason-label { display: block; color: #7a7573; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 18px 0 6px; }
  .rej-reason { color: #3D3935; font-size: 14px; line-height: 1.7; padding: 14px 16px; background: rgba(10,69,88,0.04); border-left: 3px solid #0A4558; border-radius: 0 6px 6px 0; }
  .rej-context { color: #7a7573; font-size: 13px; line-height: 1.6; margin: 12px 0; }
  .rej-encouragement { color: #3D3935; font-size: 14px; line-height: 1.7; margin: 20px 0; padding-top: 16px; border-top: 1px solid #eae7df; }
  .rej-contact { color: #7a7573; font-size: 13px; margin-top: 12px; line-height: 1.6; }
`;

@Injectable()
export class EntrepreneurNotificationService
  implements IEntrepreneurNotificationService
{
  private readonly templatesPath = join(
    process.cwd(),
    'src',
    'modules',
    'entrepreneurs-notifications',
    'templates',
  );

  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly emailTemplate: EmailTemplateService,
  ) {}

  async sendEntrepreneurRejectionEmailAsync(
    entrepreneur: Entrepreneur,
  ): Promise<void> {
    setImmediate(() => {
      this.sendEntrepreneurRejectionEmail(entrepreneur).catch((error) => {
        console.error('Error en notificación de rechazo background:', error);
      });
    });
  }

  async sendEntrepreneurRejectionEmail(
    entrepreneur: Entrepreneur,
  ): Promise<ServiceResponse<BatchEmailResult>> {
    try {
      const person = entrepreneur.person;

      if (!person?.email) {
        return {
          success: false,
          error: 'No se encontró email del emprendedor',
          data: {
            totalSent: 0,
            totalFailed: 0,
            errors: ['Email no disponible'],
          },
        };
      }

      const fullName =
        `${person.first_name} ${person.first_lastname || ''}`.trim();
      const rejectionReason =
        'Su solicitud no se alinea con los enfoques y criterios establecidos por la Fundación Tamarindo Park.';

      const baseTemplate = join(this.templatesPath, 'base.template.html');
      const rejectionContent = join(
        this.templatesPath,
        'entrepreneur-rejected.template.html',
      );

      const content = this.emailTemplate.render(rejectionContent, {
        ENTREPRENEUR_NAME: fullName,
        RECIPIENT_NAME: person.first_name,
        REJECTION_REASON: rejectionReason,
      });

      const html = this.emailTemplate.render(baseTemplate, {
        EMAIL_TITLE: 'Notificación sobre su Solicitud',
        RECIPIENT_NAME: person.first_name,
        CUSTOM_STYLES: REJECTION_STYLES,
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE:
          'Agradecemos su interés en formar parte de la Fundación Tamarindo Park y le deseamos éxito en sus futuros emprendimientos.',
      });

      await this.emailQueue.queueEmail({
        recipient: person.email,
        subject: 'Notificación sobre su Solicitud - Fundación Tamarindo Park',
        htmlBody: html,
        module: 'entrepreneurs',
        emailType: 'rejection',
      });

      return {
        success: true,
        data: { totalSent: 1, totalFailed: 0, errors: [] },
        message: 'Notificación de rechazo enviada exitosamente',
      };
    } catch (error: any) {
      console.error(
        '🔥 ERROR CRÍTICO en sendEntrepreneurRejectionEmail:',
        error,
      );
      return {
        success: false,
        error: error.message,
        data: { totalSent: 0, totalFailed: 0, errors: [error.message] },
      };
    }
  }

  async sendEntrepreneurStatusChangeEmail(
    _entrepreneur: Entrepreneur,
    _oldStatus: string,
    _newStatus: string,
  ): Promise<ServiceResponse<BatchEmailResult>> {
    return {
      success: true,
      data: { totalSent: 0, totalFailed: 0, errors: [] },
      message: 'Método no implementado',
    };
  }
}
