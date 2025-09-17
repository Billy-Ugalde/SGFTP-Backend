import { StatusEmailData, ContentChangesEmailData, NewFairEmailData, TemplateVariables } from './notification.interface';

export interface ITemplateService {
  generateStatusChangeEmail(data: StatusEmailData): string;
  generateContentChangesEmail(data: ContentChangesEmailData): string;
  generateNewFairEmail(data: NewFairEmailData): string;
  
  loadTemplate(templateName: string): string;
  replaceVariables(template: string, variables: TemplateVariables): string;
  validateTemplate(templateName: string, requiredVariables: string[]): boolean;
}