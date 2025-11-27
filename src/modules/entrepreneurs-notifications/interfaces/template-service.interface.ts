import { 
  EntrepreneurRejectedEmailData,
  EntrepreneurStatusEmailData,
  TemplateVariables 
} from './entrepreneur-notification.interface';

export interface ITemplateService {
  generateEntrepreneurRejectionEmail(data: EntrepreneurRejectedEmailData): string;
  generateEntrepreneurStatusChangeEmail(data: EntrepreneurStatusEmailData): string;
  loadTemplate(templateName: string): string;
  replaceVariables(template: string, variables: TemplateVariables): string;
  validateTemplate(templateName: string, requiredVariables: string[]): boolean;
}