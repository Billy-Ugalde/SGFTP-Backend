import { 
  StatusEmailData, 
  ContentChangesEmailData, 
  NewFairEmailData, 
  TemplateVariables,
  EnrollmentApprovedEmailData,
  EnrollmentRejectedEmailData
} from './notification.interface';

export interface ITemplateService {
  generateStatusChangeEmail(data: StatusEmailData): string;
  generateContentChangesEmail(data: ContentChangesEmailData): string;
  generateNewFairEmail(data: NewFairEmailData): string;

  generateEnrollmentApprovedEmail(data: EnrollmentApprovedEmailData): string;
  generateEnrollmentRejectedEmail(data: EnrollmentRejectedEmailData): string;
  
  loadTemplate(templateName: string): string;
  replaceVariables(template: string, variables: TemplateVariables): string;
  validateTemplate(templateName: string, requiredVariables: string[]): boolean;
}