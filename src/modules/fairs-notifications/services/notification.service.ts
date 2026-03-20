import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { EmailQueueService } from '../../shared/email/services/email-queue.service';
import { EmailTemplateService } from '../../shared/email/services/email-template.service';
import {
  ChangeInfo,
  StatusEmailData,
  ContentChangesEmailData,
  NewFairEmailData,
  EnrollmentApprovedEmailData,
  EnrollmentRejectedEmailData,
  EmailResult,
  EmailOptions,
} from '../interfaces/notification.interface';
import { INotificationService } from '../interfaces/notification-service.interface';

// Brand palette
const C_NAVY   = '#0A4558';
const C_GREEN  = '#52AC83';
const C_CREAM  = '#F6F4EB';
const C_DARK   = '#3D3935';
const C_MUTED  = '#7a7573';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly templatesPath = join(
    process.cwd(),
    'src',
    'modules',
    'fairs-notifications',
    'templates',
  );

  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly emailTemplate: EmailTemplateService,
  ) {}

  private t(name: string): string {
    return join(this.templatesPath, `${name}.template.html`);
  }

  private replaceVars(path: string, vars: Record<string, string>): string {
    return this.emailTemplate.render(path, vars);
  }

  // ── CSS style blocks ────────────────────────────────────────────────────────

  private getStatusStyles(statusColor: string, _statusBgColor: string): string {
    return `
      .sc-header { text-align: center; padding: 20px 0 8px; }
      .sc-icon { font-size: 38px; display: block; margin-bottom: 10px; }
      .sc-title { color: ${statusColor}; font-size: 21px; font-weight: 700; margin-bottom: 0; }
      .sc-fair-row { border-top: 1px solid #eae7df; border-bottom: 1px solid #eae7df; padding: 14px 0; margin: 20px 0; }
      .sc-fair-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
      .sc-fair-name { color: ${C_NAVY}; font-size: 17px; font-weight: 700; }
      .sc-message { color: ${C_DARK}; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
      .sc-tip { color: ${C_MUTED}; font-size: 13px; font-style: italic; }
    `;
  }

  private getContentChangesStyles(): string {
    return `
      .cc-intro { font-size: 15px; color: ${C_DARK}; line-height: 1.6; margin-bottom: 14px; }
      .cc-count { color: ${C_MUTED}; font-size: 13px; margin-bottom: 16px; }
      .cc-table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
      .cc-note { color: ${C_MUTED}; font-size: 13px; }
    `;
  }

  private getNewFairStyles(): string {
    return `
      .nf-title { color: ${C_NAVY}; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
      .nf-subtitle { color: ${C_MUTED}; font-size: 14px; margin-bottom: 20px; }
      .nf-section { margin: 20px 0; }
      .nf-section-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
      .nf-section-text { color: ${C_DARK}; font-size: 14px; line-height: 1.7; margin: 0; }
      .nf-details { border-top: 1px solid #eae7df; margin: 20px 0; }
      .nf-row { padding: 12px 0; border-bottom: 1px solid #eae7df; display: flex; gap: 12px; align-items: flex-start; }
      .nf-row:last-child { border-bottom: none; }
      .nf-icon { font-size: 15px; width: 20px; flex-shrink: 0; padding-top: 2px; }
      .nf-row-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .nf-row-value { color: ${C_DARK}; font-size: 14px; font-weight: 500; }
      .nf-cta { color: ${C_DARK}; font-size: 14px; line-height: 1.7; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eae7df; }
    `;
  }

  private getEnrollmentApprovedStyles(): string {
    return `
      .ea-header { text-align: center; padding: 20px 0 8px; }
      .ea-icon { font-size: 36px; display: block; margin-bottom: 10px; }
      .ea-title { color: #1a5c38; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
      .ea-subtitle { color: #3a7a5a; font-size: 15px; margin: 0; }
      .ea-fair-name { color: ${C_NAVY}; font-size: 20px; font-weight: 700; margin: 20px 0 4px; }
      .ea-stand-label { color: ${C_MUTED}; font-size: 12px; margin-bottom: 4px; }
      .ea-stand-badge { display: inline-block; background: ${C_GREEN}; color: #ffffff; padding: 8px 22px; border-radius: 20px; font-size: 18px; font-weight: 700; letter-spacing: 1px; margin: 4px 0 16px; }
      .ea-ext-note { color: #3a7a5a; font-size: 14px; margin: 4px 0 16px; }
      .ea-details { border-top: 1px solid #eae7df; margin: 16px 0; }
      .ea-row { padding: 11px 0; border-bottom: 1px solid #eae7df; display: flex; gap: 12px; align-items: flex-start; }
      .ea-row:last-child { border-bottom: none; }
      .ea-row-icon { font-size: 15px; width: 20px; flex-shrink: 0; padding-top: 2px; }
      .ea-row-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .ea-row-value { color: ${C_DARK}; font-size: 14px; font-weight: 500; }
      .ea-section { margin: 20px 0; }
      .ea-section-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
      .ea-section-text { color: ${C_DARK}; font-size: 14px; line-height: 1.7; margin: 0; }
      .ea-steps { border-top: 1px solid #eae7df; margin-top: 20px; padding-top: 16px; }
      .ea-steps-title { color: ${C_NAVY}; font-size: 14px; font-weight: 600; margin-bottom: 10px; }
      .ea-steps ul { color: ${C_DARK}; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px; }
      .ea-steps li { margin-bottom: 8px; }
      .ea-closing { text-align: center; color: ${C_NAVY}; font-size: 15px; font-weight: 600; margin-top: 20px; padding-top: 16px; border-top: 1px solid #eae7df; }
    `;
  }

  private getEnrollmentRejectedStyles(): string {
    return `
      .er-header { text-align: center; padding: 20px 0 8px; }
      .er-icon { font-size: 34px; display: block; margin-bottom: 10px; }
      .er-title { color: ${C_DARK}; font-size: 20px; font-weight: 700; margin-bottom: 0; }
      .er-fair-name { color: ${C_NAVY}; font-size: 18px; font-weight: 700; margin: 16px 0 6px; }
      .er-status-badge { display: inline-block; background: #dc3545; color: #ffffff; padding: 5px 16px; border-radius: 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
      .er-message { color: ${C_DARK}; font-size: 15px; line-height: 1.7; margin: 12px 0; }
      .er-details { border-top: 1px solid #eae7df; margin: 16px 0; }
      .er-row { padding: 11px 0; border-bottom: 1px solid #eae7df; }
      .er-row:last-child { border-bottom: none; }
      .er-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .er-value { color: ${C_DARK}; font-size: 14px; font-weight: 500; }
      .er-ext-note { color: ${C_MUTED}; font-size: 13px; line-height: 1.6; margin: 12px 0; }
      .er-encouragement { color: ${C_DARK}; font-size: 14px; line-height: 1.7; margin: 20px 0; padding-top: 16px; border-top: 1px solid #eae7df; }
      .er-contact { color: ${C_MUTED}; font-size: 13px; margin-top: 12px; }
    `;
  }

  private getEnrollmentCancelledPendingStyles(): string {
    return `
      .ec-header { text-align: center; padding: 20px 0 8px; }
      .ec-icon { font-size: 36px; display: block; margin-bottom: 10px; }
      .ec-title { color: ${C_NAVY}; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
      .ec-subtitle { color: ${C_MUTED}; font-size: 14px; margin: 0; }
      .ec-fair-name { color: ${C_NAVY}; font-size: 18px; font-weight: 700; margin: 18px 0 6px; }
      .ec-tag { display: inline-block; background: rgba(10,69,88,0.08); color: ${C_NAVY}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 14px; margin-bottom: 16px; }
      .ec-details { border-top: 1px solid #eae7df; margin: 12px 0; }
      .ec-row { padding: 11px 0; border-bottom: 1px solid #eae7df; display: flex; gap: 12px; align-items: flex-start; }
      .ec-row:last-child { border-bottom: none; }
      .ec-row-icon { font-size: 15px; width: 20px; flex-shrink: 0; padding-top: 2px; }
      .ec-row-label { display: block; color: ${C_MUTED}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .ec-row-value { color: ${C_DARK}; font-size: 14px; font-weight: 600; }
      .ec-status { text-align: center; margin: 18px 0; }
      .ec-badge { display: inline-block; background: ${C_NAVY}; color: #ffffff; padding: 6px 18px; border-radius: 16px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
      .ec-status-msg { color: ${C_MUTED}; font-size: 14px; margin-top: 10px; line-height: 1.7; }
      .ec-notice-title { color: ${C_NAVY}; font-size: 14px; font-weight: 600; margin: 20px 0 8px; padding-top: 16px; border-top: 1px solid #eae7df; }
      .ec-notice-list { color: ${C_DARK}; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px; }
      .ec-notice-list li { margin-bottom: 6px; }
      .ec-closing { color: ${C_DARK}; font-size: 14px; line-height: 1.7; margin-top: 16px; }
    `;
  }

  // ── Change-rows table ────────────────────────────────────────────────────────

  private getFieldIcon(field: string): string {
    const icons: Record<string, string> = {
      'Nombre de la Feria': '🏷️',
      'Descripción': '📄',
      'Fecha y Hora': '📅',
      'Fecha': '📅',
      'Ubicación': '📍',
      'Condiciones': '📋',
      'Tipo de Feria': '🎪',
      'Capacidad de Stands': '🏬',
    };
    return icons[field] || '📄';
  }

  private generateChangesRows(changes: ChangeInfo[]): string {
    return changes
      .map(
        (change) => `
      <tr style="border-bottom: 1px solid ${C_CREAM};">
        <td style="padding: 14px 10px; vertical-align: top; width: 36px;">
          <span style="font-size: 18px;">${this.getFieldIcon(change.field)}</span>
        </td>
        <td style="padding: 14px 10px; vertical-align: top;">
          <div>
            <h4 style="margin: 0 0 7px 0; color: ${C_NAVY}; font-size: 15px; font-weight: 700;">${change.field}</h4>
            <div style="margin-bottom: 4px;"><span style="color: ${C_MUTED}; font-size: 12px; font-weight: 600;">Anterior:</span> <span style="color: #c82333; font-size: 13px; margin-left: 4px;">${change.oldValue}</span></div>
            <div style="margin-bottom: 7px;"><span style="color: ${C_MUTED}; font-size: 12px; font-weight: 600;">Nuevo:</span> <span style="color: #1a5c38; font-size: 13px; font-weight: 500; margin-left: 4px;">${change.newValue}</span></div>
            <p style="margin: 0; color: ${C_MUTED}; font-size: 12px; font-style: italic;">${change.description}</p>
          </div>
        </td>
      </tr>`,
      )
      .join('');
  }

  // ── Public send methods ──────────────────────────────────────────────────────

  async sendStatusChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    statusType: string,
    statusMessage: string,
  ): Promise<EmailResult> {
    try {
      const isCancellation = statusType.includes('Cancelada');
      const statusColor   = isCancellation ? '#c82333' : '#1a5c38';
      const statusBgColor = isCancellation ? 'rgba(200,35,51,0.06)' : 'rgba(26,92,56,0.06)';
      const statusIcon    = isCancellation ? '⚠️' : '✅';

      const data: StatusEmailData = { recipientName, fairName, statusType, statusMessage, statusColor, statusIcon, statusBgColor };

      const content = this.replaceVars(this.t('status-change'), {
        STATUS_ICON: data.statusIcon,
        STATUS_TYPE: data.statusType,
        FAIR_NAME: data.fairName,
        STATUS_MESSAGE: data.statusMessage,
      });

      const html = this.replaceVars(this.t('base'), {
        EMAIL_TITLE: data.statusType,
        RECIPIENT_NAME: data.recipientName,
        CUSTOM_STYLES: this.getStatusStyles(statusColor, statusBgColor),
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE: 'Si tienes alguna pregunta o consulta, no dudes en contactarnos.',
      });

      await this.emailQueue.queueEmail({
        recipient: recipientEmail,
        subject: `IMPORTANTE - ${statusType}: ${fairName}`,
        htmlBody: html,
        module: 'fairs',
        emailType: 'status-change',
      });

      return { success: true, recipientEmail };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail };
    }
  }

  async sendEnrollmentCancelledPendingEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDate: string,
    fairType: string,
  ): Promise<EmailResult> {
    try {
      const content = this.replaceVars(this.t('enrollment-cancelled-pending'), {
        FAIR_NAME: fairName,
        FAIR_DATE: fairDate,
        FAIR_TYPE: fairType,
      });

      const html = this.replaceVars(this.t('base'), {
        EMAIL_TITLE: 'Inscripción Cancelada',
        RECIPIENT_NAME: recipientName,
        CUSTOM_STYLES: this.getEnrollmentCancelledPendingStyles(),
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE:
          'Lamentamos los inconvenientes. Estaremos en contacto en cuanto haya nuevas ferias disponibles.',
      });

      await this.emailQueue.queueEmail({
        recipient: recipientEmail,
        subject: `Su inscripción pendiente fue anulada — ${fairName}`,
        htmlBody: html,
        module: 'fairs',
        emailType: 'enrollment-cancelled-pending',
      });

      return { success: true, recipientEmail };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail };
    }
  }

  async sendContentChangesEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changes: ChangeInfo[],
  ): Promise<EmailResult> {
    try {
      const data: ContentChangesEmailData = { recipientName, fairName, changes };
      const changesRows  = this.generateChangesRows(data.changes);
      const changesCount = data.changes.length;
      const changesPlural = changesCount > 1 ? 's' : '';

      const content = this.replaceVars(this.t('content-changes'), {
        FAIR_NAME: data.fairName,
        CHANGES_COUNT: changesCount.toString(),
        CHANGES_PLURAL: changesPlural,
        CHANGES_ROWS: changesRows,
      });

      const html = this.replaceVars(this.t('base'), {
        EMAIL_TITLE: 'Actualizaciones de Feria',
        RECIPIENT_NAME: data.recipientName,
        CUSTOM_STYLES: this.getContentChangesStyles(),
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE: 'Para cualquier consulta sobre estos cambios, puedes contactarnos.',
      });

      await this.emailQueue.queueEmail({
        recipient: recipientEmail,
        subject: `Actualizaciones en feria: ${fairName}`,
        htmlBody: html,
        module: 'fairs',
        emailType: 'content-changes',
      });

      return { success: true, recipientEmail };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail };
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
    conditions: string,
  ): Promise<EmailResult> {
    try {
      const data: NewFairEmailData = { recipientName, fairName, fairDescription, fairDate, fairLocation, fairType, standCapacity, conditions };

      const content = this.replaceVars(this.t('new-fair'), {
        FAIR_NAME: data.fairName,
        FAIR_DESCRIPTION: data.fairDescription,
        FAIR_DATE: data.fairDate,
        FAIR_LOCATION: data.fairLocation,
        FAIR_TYPE: data.fairType,
        STAND_CAPACITY: data.standCapacity.toString(),
        CONDITIONS: data.conditions,
      });

      const html = this.replaceVars(this.t('base'), {
        EMAIL_TITLE: 'Nueva Feria Disponible',
        RECIPIENT_NAME: data.recipientName,
        CUSTOM_STYLES: this.getNewFairStyles(),
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE: '¡No pierdas esta oportunidad! Para más información o dudas, contáctanos.',
      });

      await this.emailQueue.queueEmail({
        recipient: recipientEmail,
        subject: `¡Nueva Feria Disponible! ${fairName}`,
        htmlBody: html,
        module: 'fairs',
        emailType: 'new-fair',
      });

      return { success: true, recipientEmail };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail };
    }
  }

  async sendEnrollmentApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDate: string,
    fairLocation: string,
    standCode: string,
    fairType: string,
    fairDescription?: string,
    conditions?: string,
  ): Promise<EmailResult> {
    try {
      const data: EnrollmentApprovedEmailData = { recipientName, fairName, fairDate, fairLocation, standCode: standCode || '', fairType, fairDescription, conditions };

      const isExternal    = data.fairType === 'Externa' || !data.standCode || data.standCode.trim() === '';
      const templateName  = isExternal ? 'enrollment-approved-external' : 'enrollment-approved-internal';

      const content = this.replaceVars(this.t(templateName), {
        FAIR_NAME: data.fairName,
        FAIR_DATE: data.fairDate,
        FAIR_LOCATION: data.fairLocation,
        STAND_CODE: data.standCode || '',
        FAIR_TYPE: data.fairType,
        FAIR_DESCRIPTION: data.fairDescription || 'Descripción no disponible',
        CONDITIONS: data.conditions || 'Sin condiciones especiales',
      });

      const html = this.replaceVars(this.t('base'), {
        EMAIL_TITLE: 'Solicitud Aprobada',
        RECIPIENT_NAME: data.recipientName,
        CUSTOM_STYLES: this.getEnrollmentApprovedStyles(),
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE: '¡Felicitaciones! Te esperamos en la feria. Para más información, contáctanos.',
      });

      await this.emailQueue.queueEmail({
        recipient: recipientEmail,
        subject: `¡Solicitud Aprobada! - ${fairName}`,
        htmlBody: html,
        module: 'fairs',
        emailType: 'enrollment-approved',
      });

      return { success: true, recipientEmail };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail };
    }
  }

  async sendEnrollmentRejectedEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDate: string,
    fairType?: string,
    standCode?: string,
  ): Promise<EmailResult> {
    try {
      const data: EnrollmentRejectedEmailData = {
        recipientName,
        fairName,
        fairDate,
        fairType: fairType || 'Externa',
        standCode: standCode || '',
      };

      const isExternal   = data.fairType === 'Externa' || !data.standCode || data.standCode.trim() === '';
      const templateName = isExternal ? 'enrollment-rejected-external' : 'enrollment-rejected-internal';

      const content = this.replaceVars(this.t(templateName), {
        FAIR_NAME: data.fairName,
        FAIR_DATE: data.fairDate,
        FAIR_TYPE: data.fairType || 'Externa',
        STAND_CODE: data.standCode || '',
      });

      const html = this.replaceVars(this.t('base'), {
        EMAIL_TITLE: 'Notificación sobre Proceso de Selección',
        RECIPIENT_NAME: data.recipientName,
        CUSTOM_STYLES: this.getEnrollmentRejectedStyles(),
        EMAIL_CONTENT: content,
        FOOTER_MESSAGE: 'Para cualquier consulta, no dudes en contactarnos.',
      });

      await this.emailQueue.queueEmail({
        recipient: recipientEmail,
        subject: `Información sobre tu solicitud - ${fairName}`,
        htmlBody: html,
        module: 'fairs',
        emailType: 'enrollment-rejected',
      });

      return { success: true, recipientEmail };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail };
    }
  }

  async sendFairChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changeType: string,
    changeDetails: string,
  ): Promise<EmailResult> {
    if (changeType.includes('Cancelada') || changeType.includes('Reactivada')) {
      return this.sendStatusChangeEmail(recipientEmail, recipientName, fairName, changeType, changeDetails);
    }
    const changes: ChangeInfo[] = [{ field: changeType, oldValue: 'Valor anterior', newValue: 'Nuevo valor', description: changeDetails }];
    return this.sendContentChangesEmail(recipientEmail, recipientName, fairName, changes);
  }

  async sendEmail(emailOptions: EmailOptions): Promise<EmailResult> {
    try {
      await this.emailQueue.queueEmail({
        recipient: emailOptions.to,
        subject: emailOptions.subject,
        htmlBody: emailOptions.html,
        module: 'fairs',
        emailType: 'generic',
      });
      return { success: true, recipientEmail: emailOptions.to };
    } catch (error: any) {
      return { success: false, error: error.message, recipientEmail: emailOptions.to };
    }
  }

  async verifyConnection(): Promise<boolean> { return true; }
  async reinitializeTransporter(): Promise<void> { /* no-op */ }
}
