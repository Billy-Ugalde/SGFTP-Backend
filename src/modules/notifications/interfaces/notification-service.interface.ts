import { ChangeInfo, EmailResult, EmailOptions } from './notification.interface';

export interface INotificationService {

  sendStatusChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    statusType: string,
    statusMessage: string
  ): Promise<EmailResult>;

  sendContentChangesEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changes: ChangeInfo[]
  ): Promise<EmailResult>;

  sendFairChangeEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    changeType: string,
    changeDetails: string
  ): Promise<EmailResult>;

  sendNewFairEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDescription: string,
    fairDate: string,
    fairLocation: string,
    fairType: string,
    standCapacity: number,
    conditions: string
  ): Promise<EmailResult>;

  sendEnrollmentApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDate: string,
    fairLocation: string,
    standCode: string, 
    fairType: string
  ): Promise<EmailResult>;

  sendEnrollmentRejectedEmail(
    recipientEmail: string,
    recipientName: string,
    fairName: string,
    fairDate: string,
    rejectionReason?: string
  ): Promise<EmailResult>;

  sendEmail(emailOptions: EmailOptions): Promise<EmailResult>;
  verifyConnection(): Promise<boolean>;
  reinitializeTransporter(): Promise<void>;
}