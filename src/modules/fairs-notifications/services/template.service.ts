import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  ChangeInfo, 
  StatusEmailData, 
  ContentChangesEmailData,
  NewFairEmailData,
  EnrollmentApprovedEmailData, 
  EnrollmentRejectedEmailData, 
  TemplateVariables
} from '../interfaces/notification.interface';
import { ITemplateService } from '../interfaces/template-service.interface';

@Injectable()
export class TemplateService implements ITemplateService {
  private readonly templatesPath = join(process.cwd(), 'src', 'modules', 'fairs-notifications', 'templates');

  loadTemplate(templateName: string): string {
    try {
      const templatePath = join(this.templatesPath, `${templateName}.template.html`);
      return readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  replaceVariables(template: string, variables: TemplateVariables): string {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(key, 'g');
      result = result.replace(regex, variables[key].toString());
    });
    return result;
  }

  validateTemplate(templateName: string, requiredVariables: string[]): boolean {
    try {
      const template = this.loadTemplate(templateName);
      return requiredVariables.every(variable => template.includes(variable));
    } catch (error) {
      return false;
    }
  }

  private getStatusStyles(): string {
    return `
      .status-alert {
        background: var(--status-bg-color);
        border: 2px solid var(--status-color);
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
        color: var(--status-color);
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
      
      @media (max-width: 600px) {
        .status-title {
          font-size: 20px;
        }
        
        .fair-name {
          font-size: 18px;
        }
      }
    `;
  }

  private getContentChangesStyles(): string {
    return `
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
      
      @media (max-width: 650px) {
        .changes-count {
          font-size: 16px;
        }
      }
    `;
  }

  private getNewFairStyles(): string {
    return `
      .new-fair-announcement {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        padding: 30px;
        text-align: center;
        margin: 30px 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .new-fair-icon {
        font-size: 24px;
        margin-bottom: 15px;
        display: block;
        color: #4a5568;
      }

      .new-fair-title {
        color: #2d3748;
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 10px;
        line-height: 1.3;
      }

      .fair-details {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        margin: 25px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .detail-row {
        padding: 18px 20px;
        border-bottom: 1px solid #f7fafc;
        display: flex;
        align-items: flex-start;
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-icon {
        font-size: 18px;
        margin-right: 15px;
        width: 25px;
        text-align: center;
        color: #4a5568;
        margin-top: 2px;
      }

      .detail-label {
        color: #718096;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .detail-value {
        color: #2d3748;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.4;
      }

      .description-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 20px;
        margin: 20px 0;
      }

      .description-title {
        color: #2d3748;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .description-text {
        color: #4a5568;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
      }

      .call-to-action {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 6px;
        padding: 25px;
        text-align: center;
        margin: 25px 0;
        color: white;
      }

      .call-to-action p {
        color: #ffffff;
        font-size: 16px;
        font-weight: 500;
        margin: 0;
        line-height: 1.5;
      }

      .call-to-action strong {
        font-weight: 700;
        font-size: 17px;
      }

      /* Estilos responsivos */
      @media (max-width: 650px) {
        .new-fair-title {
          font-size: 19px;
        }
        
        .detail-row {
          padding: 15px;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .detail-icon {
          margin-bottom: 8px;
          margin-right: 0;
        }
        
        .new-fair-icon {
          font-size: 20px;
        }
      }
    `;
  }

  private getEnrollmentApprovedStyles(): string {
    return `
      .approval-announcement {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: 2px solid #28a745;
        border-radius: 12px;
        padding: 35px 30px;
        text-align: center;
        margin: 35px 0;
        box-shadow: 0 4px 16px rgba(40, 167, 69, 0.1);
      }

      .approval-icon {
        font-size: 32px;
        color: #28a745;
        margin-bottom: 20px;
        display: block;
      }

      .approval-title {
        color: #155724;
        font-size: 26px;
        font-weight: 700;
        margin-bottom: 15px;
        line-height: 1.3;
      }

      .approval-message {
        color: #155724;
        font-size: 16px;
        margin: 0;
        line-height: 1.6;
        padding: 0 15px;
      }

      .fair-title-section {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border: 2px solid #cbd5e0;
        border-radius: 12px;
        padding: 30px 25px;
        text-align: center;
        margin: 35px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .fair-main-title {
        color: #2d3748;
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        line-height: 1.4;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        word-wrap: break-word;
      }

      .stand-info {
        background: #ffffff;
        border: 2px solid #28a745;
        border-radius: 12px;
        padding: 30px 25px;
        margin: 35px 0;
        text-align: center;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.1);
      }

      .stand-code {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 20px;
        font-weight: 700;
        display: inline-block;
        margin: 15px 0;
        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
        letter-spacing: 1px;
      }

      .external-participation-info {
        background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
        border: 2px solid #1890ff;
        border-radius: 12px;
        padding: 30px 25px;
        margin: 35px 0;
        text-align: center;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
      }

      .participation-title {
        color: #0050b3;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 15px;
      }

      .participation-description {
        color: #096dd9;
        font-size: 15px;
        margin: 0;
        line-height: 1.7;
        padding: 0 15px;
      }

      .fair-comprehensive-details {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 30px 25px;
        margin: 35px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .section-title {
        color: #2d3748;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 12px;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .detail-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 25px 20px;
        display: flex;
        align-items: flex-start;
        transition: all 0.2s ease;
      }

      .detail-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e0;
      }

      .detail-content {
        flex: 1;
      }

      .detail-label-new {
        display: block;
        color: #718096;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .detail-value-new {
        color: #2d3748;
        font-size: 16px;
        font-weight: 500;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .description-comprehensive,
      .conditions-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #4299e1;
        border-radius: 8px;
        padding: 30px 25px;
        margin: 35px 0;
      }

      .description-content,
      .conditions-content {
        color: #4a5568;
        font-size: 15px;
        line-height: 1.8;
        margin: 0;
      }

      .description-content p,
      .conditions-content p {
        margin: 0;
        padding: 0;
        word-wrap: break-word;
      }

      .next-steps {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 1px solid #f39c12;
        border-radius: 12px;
        padding: 30px 25px;
        margin: 35px 0;
      }

      .next-steps h4 {
        color: #856404;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
      }

      .next-steps ul {
        color: #856404;
        font-size: 15px;
        line-height: 1.8;
        margin: 0;
        padding-left: 25px;
      }

      .next-steps li {
        margin-bottom: 12px;
      }

      .congratulations-section {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 35px 30px;
        text-align: center;
        margin: 35px 0;
        color: white;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      }

      @media (max-width: 650px) {
        .approval-announcement,
        .fair-title-section,
        .stand-info,
        .external-participation-info,
        .fair-comprehensive-details,
        .description-comprehensive,
        .conditions-section,
        .next-steps,
        .congratulations-section {
          padding: 20px 15px;
          margin: 20px 0;
        }
        
        .approval-title {
          font-size: 22px;
        }
        
        .fair-main-title {
          font-size: 20px;
        }
        
        .stand-code {
          font-size: 18px;
          padding: 10px 20px;
        }
        
        .detail-item {
          flex-direction: column;
          align-items: flex-start;
          padding: 20px 15px;
        }
        
        .section-title {
          font-size: 16px;
        }
        
        .detail-value-new {
          font-size: 15px;
        }
      }
    `;
  }

      private getEnrollmentRejectedStyles(): string {
      return `
        .rejection-announcement {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #ced4da;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 25px 0;
        }

        .rejection-icon {
          font-size: 48px;
          margin-bottom: 15px;
          filter: drop-shadow(0 2px 4px rgba(220, 53, 69, 0.3));
        }

        .rejection-title {
          color: #495057;
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .rejection-message {
          color: #6c757d;
          font-size: 15px;
          margin: 0;
          line-height: 1.5;
        }

        .fair-title-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 25px 0;
        }

        .fair-main-title {
          color: #2d3748;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .rejection-status {
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
        }

        .rejection-status-title {
          color: #495057;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .rejection-status-badge {
          background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          display: inline-block;
          margin: 10px 0 15px 0;
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .rejection-status-message {
          color: #6c757d;
          font-size: 16px;
          margin: 0;
          line-height: 1.6;
        }

        .rejection-details {
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }

        .detail-row {
          padding: 12px 0;
          border-bottom: 1px solid #f1f3f4;
          display: flex;
          align-items: center;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #6c757d;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          display: block;
        }

        .detail-value {
          color: #495057;
          font-size: 14px;
          font-weight: 500;
        }

        .detail-content {
          flex: 1;
        }

        .stand-rejection-info {
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
          border: 2px solid #f44336;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.15);
        }

        .stand-rejection-title {
          color: #c62828;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .stand-rejection-code {
          background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 700;
          display: inline-block;
          margin: 10px 0 15px 0;
          box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
          letter-spacing: 1px;
        }

        .stand-rejection-message {
          color: #c62828;
          font-size: 15px;
          margin: 0;
          font-weight: 500;
        }

        /* Estilos específicos para ferias EXTERNAS */
        .external-rejection-note {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border: 2px solid #ff9800;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
        }

        .external-rejection-title {
          color: #ef6c00;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 15px;
        }

        .external-rejection-message {
          color: #ef6c00;
          font-size: 15px;
          margin: 0;
          line-height: 1.6;
          font-weight: 500;
        }

        .professional-message {
          background: #f8f9fa;
          border-left: 4px solid #6c757d;
          border-radius: 4px;
          padding: 20px;
          margin: 25px 0;
        }

        .professional-message p {
          color: #495057;
          font-size: 15px;
          margin: 0;
          line-height: 1.6;
        }

        .future-opportunities {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 8px;
          padding: 25px;
          text-align: center;
          margin: 25px 0;
        }

        .future-opportunities p {
          color: #4a5568;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          line-height: 1.5;
        }

        .contact-section {
          background: #edf2f7;
          border-left: 4px solid #4299e1;
          border-radius: 4px;
          padding: 20px;
          margin: 25px 0;
        }

        .contact-section p {
          color: #2d3748;
          font-size: 15px;
          margin: 0;
          line-height: 1.6;
          font-weight: 500;
        }

        @media (max-width: 650px) {
          .rejection-announcement,
          .fair-title-section,
          .rejection-status,
          .rejection-details,
          .stand-rejection-info,
          .external-rejection-note,
          .professional-message,
          .future-opportunities,
          .contact-section {
            padding: 15px;
            margin: 15px 0;
          }
          
          .rejection-title {
            font-size: 18px;
          }
          
          .fair-main-title {
            font-size: 18px;
          }
          
          .stand-rejection-code {
            font-size: 14px;
            padding: 10px 20px;
          }

          .rejection-icon {
            font-size: 36px;
          }
        }
      `;
    }

  private getFieldIcon(field: string): string {
    const icons: { [key: string]: string } = {
      'Nombre de la Feria': '🏷️',
      'Descripción': '📄',
      'Fecha y Hora': '📅',
      'Fecha': '📅',
      'Ubicación': '📍',
      'Condiciones': '📋',
      'Tipo de Feria': '🎪',
      'Capacidad de Stands': '🏬'
    };
    return icons[field] || '📄';
  }

  private generateChangesRows(changes: ChangeInfo[]): string {
    return changes.map((change) => `
      <tr style="border-bottom: 1px solid #e9ecef;">
        <td style="padding: 15px 10px; vertical-align: top; width: 40px;">
          <span style="font-size: 20px;">${this.getFieldIcon(change.field)}</span>
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
  }

  generateStatusChangeEmail(data: StatusEmailData): string {
    const baseTemplate = this.loadTemplate('base');
    const statusContent = this.loadTemplate('status-change');

    let stylesWithVariables = this.getStatusStyles();
    stylesWithVariables = stylesWithVariables.replace(/var\(--status-color\)/g, data.statusColor);
    stylesWithVariables = stylesWithVariables.replace(/var\(--status-bg-color\)/g, data.statusBgColor);

    const contentWithData = this.replaceVariables(statusContent, {
      'STATUS_ICON': data.statusIcon,
      'STATUS_TYPE': data.statusType,
      'FAIR_NAME': data.fairName,
      'STATUS_MESSAGE': data.statusMessage
    });

    const variables = {
      'EMAIL_TITLE': data.statusType,
      'RECIPIENT_NAME': data.recipientName,
      'CUSTOM_STYLES': stylesWithVariables,
      'EMAIL_CONTENT': contentWithData,
      'FOOTER_MESSAGE': 'Si tienes alguna pregunta o consulta, no dudes en contactarnos. Estamos aquí para apoyarte.'
    };

    return this.replaceVariables(baseTemplate, variables);
  }

  generateContentChangesEmail(data: ContentChangesEmailData): string {
    const baseTemplate = this.loadTemplate('base');
    const changesContent = this.loadTemplate('content-changes');

    const changesRows = this.generateChangesRows(data.changes);
    const changesCount = data.changes.length;
    const changesPlural = changesCount > 1 ? 's' : '';

    const contentWithData = this.replaceVariables(changesContent, {
      'FAIR_NAME': data.fairName,
      'CHANGES_COUNT': changesCount.toString(),
      'CHANGES_PLURAL': changesPlural,
      'CHANGES_ROWS': changesRows
    });

    const variables = {
      'EMAIL_TITLE': 'Actualizaciones de Feria',
      'RECIPIENT_NAME': data.recipientName,
      'CUSTOM_STYLES': this.getContentChangesStyles(),
      'EMAIL_CONTENT': contentWithData,
      'FOOTER_MESSAGE': 'Para cualquier consulta sobre estos cambios, puedes contactarnos.'
    };

    return this.replaceVariables(baseTemplate, variables);
  }

  generateNewFairEmail(data: NewFairEmailData): string {
    const baseTemplate = this.loadTemplate('base');
    const newFairContent = this.loadTemplate('new-fair');

    const contentWithData = this.replaceVariables(newFairContent, {
      'FAIR_NAME': data.fairName,
      'FAIR_DESCRIPTION': data.fairDescription,
      'FAIR_DATE': data.fairDate,
      'FAIR_LOCATION': data.fairLocation,
      'FAIR_TYPE': data.fairType,
      'STAND_CAPACITY': data.standCapacity.toString(),
      'CONDITIONS': data.conditions
    });

    const variables = {
      'EMAIL_TITLE': 'Nueva Feria Disponible',
      'RECIPIENT_NAME': data.recipientName,
      'CUSTOM_STYLES': this.getNewFairStyles(),
      'EMAIL_CONTENT': contentWithData,
      'FOOTER_MESSAGE': '¡No pierdas esta oportunidad! Para más información o dudas, contáctanos.'
    };

    return this.replaceVariables(baseTemplate, variables);
  }

  generateEnrollmentApprovedEmail(data: EnrollmentApprovedEmailData): string {
    const baseTemplate = this.loadTemplate('base');
  
    const isExternalFair = data.fairType === 'Externa' || !data.standCode || data.standCode.trim() === '';
    
    const templateName = isExternalFair ? 'enrollment-approved-external' : 'enrollment-approved-internal';
    const approvedContent = this.loadTemplate(templateName);

    const contentWithData = this.replaceVariables(approvedContent, {
      'FAIR_NAME': data.fairName,
      'FAIR_DATE': data.fairDate,
      'FAIR_LOCATION': data.fairLocation,
      'STAND_CODE': data.standCode || '',
      'FAIR_TYPE': data.fairType,
      'FAIR_DESCRIPTION': data.fairDescription || 'Descripción no disponible', 
      'CONDITIONS': data.conditions || 'Sin condiciones especiales'
    });

    const variables = {
      'EMAIL_TITLE': 'Solicitud Aprobada',
      'RECIPIENT_NAME': data.recipientName,
      'CUSTOM_STYLES': this.getEnrollmentApprovedStyles(),
      'EMAIL_CONTENT': contentWithData,
      'FOOTER_MESSAGE': '¡Felicitaciones! Te esperamos en la feria. Para más información, contáctanos.'
    };

    return this.replaceVariables(baseTemplate, variables);
  }

  generateEnrollmentRejectedEmail(data: EnrollmentRejectedEmailData): string {
    const baseTemplate = this.loadTemplate('base');

    const isExternalFair = data.fairType === 'Externa' || !data.standCode || data.standCode.trim() === '';
    const templateName = isExternalFair ? 'enrollment-rejected-external' : 'enrollment-rejected-internal';
    
    console.log(`Generando email de rechazo:`, {
      fairType: data.fairType,
      standCode: data.standCode,
      isExternalFair,
      templateName
    });
    
    const rejectedContent = this.loadTemplate(templateName);

    const contentWithData = this.replaceVariables(rejectedContent, {
      'FAIR_NAME': data.fairName,
      'FAIR_DATE': data.fairDate,
      'FAIR_TYPE': data.fairType || 'Externa',
      'STAND_CODE': data.standCode || ''
    });

    const variables = {
      'EMAIL_TITLE': 'Notificación sobre Proceso de Selección',
      'RECIPIENT_NAME': data.recipientName,
      'CUSTOM_STYLES': this.getEnrollmentRejectedStyles(),
      'EMAIL_CONTENT': contentWithData,
      'FOOTER_MESSAGE': 'Para cualquier consulta, no dudes en contactarnos.'
    };

    return this.replaceVariables(baseTemplate, variables);
  }
}