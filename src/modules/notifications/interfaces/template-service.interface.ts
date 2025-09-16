import { StatusEmailData, ContentChangesEmailData, TemplateVariables } from './notification.interface';

export interface ITemplateService {
  generateStatusChangeEmail(data: StatusEmailData): string;
  generateContentChangesEmail(data: ContentChangesEmailData): string;
  loadTemplate(templateName: string): string;
  replaceVariables(template: string, variables: TemplateVariables): string;
  validateTemplate(templateName: string, requiredVariables: string[]): boolean;
}