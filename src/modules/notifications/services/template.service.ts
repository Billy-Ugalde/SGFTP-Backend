import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  ChangeInfo, 
  StatusEmailData, 
  ContentChangesEmailData,
  TemplateVariables
} from '../interfaces/notification.interface';
import { ITemplateService } from '../interfaces/template-service.interface';

@Injectable()
export class TemplateService implements ITemplateService {
  private readonly templatesPath = join(process.cwd(), 'src', 'modules', 'notifications', 'templates');

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
}