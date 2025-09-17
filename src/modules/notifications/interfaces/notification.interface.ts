export interface ChangeInfo {
  field: string;
  oldValue: string;
  newValue: string;
  description: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface StatusEmailData {
  recipientName: string;
  fairName: string;
  statusType: string;
  statusMessage: string;
  statusColor: string;
  statusIcon: string;
  statusBgColor: string;
}

export interface ContentChangesEmailData {
  recipientName: string;
  fairName: string;
  changes: ChangeInfo[];
}

export interface NewFairEmailData {
  recipientName: string;
  fairName: string;
  fairDescription: string;
  fairDate: string;
  fairLocation: string;
  fairType: string;
  standCapacity: number;
  conditions: string;
}

export interface NotificationConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipientEmail: string;
}

export interface BatchEmailResult {
  totalSent: number;
  totalFailed: number;
  errors: string[];
}

export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserEmailData {
  email: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  isValid: boolean;
}

export interface BatchConfig {
  batchSize: number;
  delayMs: number;
  maxRetries: number;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export enum NotificationType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  CONTENT_CHANGES = 'CONTENT_CHANGES',
  NEW_FAIR = 'NEW_FAIR'
}