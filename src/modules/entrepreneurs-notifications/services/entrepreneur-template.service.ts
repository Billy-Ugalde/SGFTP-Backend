import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  EntrepreneurRejectedEmailData,
  EntrepreneurStatusEmailData,
  TemplateVariables
} from '../interfaces/entrepreneur-notification.interface';
import { ITemplateService } from '../interfaces/template-service.interface';

@Injectable()
export class EntrepreneurTemplateService implements ITemplateService {
  private readonly templatesPath = join(process.cwd(), 'src', 'modules', 'entrepreneurs-notifications', 'templates');

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
    // Escapar caracteres especiales de regex
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    result = result.replace(regex, String(variables[key]));
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

  private getEntrepreneurRejectionStyles(): string {
    return `
      .rejection-announcement {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border: 2px solid #ced4da;
        border-radius: 12px;
        padding: 35px 30px;
        text-align: center;
        margin: 35px 0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
      }

      .rejection-icon {
        font-size: 48px;
        margin-bottom: 20px;
        display: block;
        filter: drop-shadow(0 2px 4px rgba(220, 53, 69, 0.3));
      }

      .rejection-title {
        color: #495057;
        font-size: 26px;
        font-weight: 700;
        margin-bottom: 15px;
        line-height: 1.3;
      }

      .rejection-message {
        color: #6c757d;
        font-size: 16px;
        margin: 0;
        line-height: 1.6;
        padding: 0 15px;
      }

      .entrepreneur-info {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 30px 25px;
        margin: 35px 0;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .entrepreneur-name {
        color: #2d3748;
        font-size: 22px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .entrepreneur-email {
        color: #718096;
        font-size: 16px;
        margin: 0;
      }

      .reason-section {
        background: linear-gradient(135deg, #fff3f3 0%, #ffe6e6 100%);
        border: 2px solid #f8d7da;
        border-radius: 12px;
        padding: 30px 25px;
        margin: 35px 0;
      }

      .reason-title {
        color: #721c24;
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        border-bottom: 2px solid #f8d7da;
        padding-bottom: 12px;
      }

      .reason-content {
        color: #856404;
        font-size: 15px;
        line-height: 1.8;
        margin: 0;
      }

      .reason-content p {
        margin: 0;
        padding: 0;
        word-wrap: break-word;
      }

      .future-opportunities {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 12px;
        padding: 30px 25px;
        text-align: center;
        margin: 35px 0;
      }

      .future-title {
        color: #2d3748;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 15px;
      }

      .future-message {
        color: #4a5568;
        font-size: 16px;
        margin: 0;
        line-height: 1.6;
      }

      .contact-section {
        background: #edf2f7;
        border-left: 4px solid #4299e1;
        border-radius: 4px;
        padding: 25px;
        margin: 35px 0;
      }

      .contact-title {
        color: #2d3748;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .contact-message {
        color: #4a5568;
        font-size: 15px;
        margin: 0;
        line-height: 1.6;
      }

      .professional-closing {
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border: 1px solid #f39c12;
        border-radius: 12px;
        padding: 25px;
        margin: 35px 0;
        text-align: center;
      }

      .closing-message {
        color: #856404;
        font-size: 15px;
        font-weight: 500;
        margin: 0;
        line-height: 1.6;
      }

      @media (max-width: 650px) {
        .rejection-announcement,
        .entrepreneur-info,
        .reason-section,
        .future-opportunities,
        .contact-section,
        .professional-closing {
          padding: 20px 15px;
          margin: 20px 0;
        }
        
        .rejection-title {
          font-size: 22px;
        }
        
        .entrepreneur-name {
          font-size: 20px;
        }
        
        .rejection-icon {
          font-size: 36px;
        }
      }
    `;
  }

  generateEntrepreneurRejectionEmail(data: EntrepreneurRejectedEmailData): string {
  console.log('🎨 TEMPLATE: Generando email de rechazo');
  console.log('📋 Datos para template:', data);
  
  try {
    console.log('📁 Cargando template base...');
    const baseTemplate = this.loadTemplate('base');
    console.log('✅ Base template cargado, longitud:', baseTemplate.length);
    
    console.log('📁 Cargando template de rechazo...');
    const rejectionContent = this.loadTemplate('entrepreneur-rejected');
    console.log('✅ Rejection template cargado, longitud:', rejectionContent.length);

    const contentWithData = this.replaceVariables(rejectionContent, {
      'ENTREPRENEUR_NAME': data.entrepreneurName,
      'RECIPIENT_NAME': data.recipientName,
      'REJECTION_REASON': data.rejectionReason
    });

    const variables = {
      'EMAIL_TITLE': 'Notificación sobre su Solicitud',
      'RECIPIENT_NAME': data.recipientName,
      'CUSTOM_STYLES': this.getEntrepreneurRejectionStyles(),
      'EMAIL_CONTENT': contentWithData,
      'FOOTER_MESSAGE': 'Agradecemos su interés en formar parte de la Fundación Tamarindo Park y le deseamos éxito en sus futuros emprendimientos.'
    };

    const finalHtml = this.replaceVariables(baseTemplate, variables);
    console.log('✅ HTML final generado, longitud:', finalHtml.length);
    
    return finalHtml;
  } catch (error) {
    console.error('❌ Error generando email:', error);
    throw error;
  }
}

  generateEntrepreneurStatusChangeEmail(data: EntrepreneurStatusEmailData): string {
    // Implementación para otros tipos de notificaciones si es necesario
    return '';
  }
}