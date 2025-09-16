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

export interface NotificationConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}