export interface EntrepreneurRejectedEmailData {
  recipientName: string;
  recipientEmail: string;
  entrepreneurName: string;
  rejectionReason: string;
}

export interface EntrepreneurStatusEmailData {
  recipientName: string;
  recipientEmail: string;
  entrepreneurName: string;
  oldStatus: string;
  newStatus: string;
  statusMessage: string;
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

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}