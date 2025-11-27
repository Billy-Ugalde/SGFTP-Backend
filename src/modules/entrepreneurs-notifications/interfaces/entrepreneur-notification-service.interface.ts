import { ServiceResponse, BatchEmailResult } from './entrepreneur-notification.interface';
import { Entrepreneur } from 'src/modules/entrepreneurs/entities/entrepreneur.entity';

export interface IEntrepreneurNotificationService {
  sendEntrepreneurRejectionEmailAsync(entrepreneur: Entrepreneur): Promise<void>;
  sendEntrepreneurRejectionEmail(entrepreneur: Entrepreneur): Promise<ServiceResponse<BatchEmailResult>>;
  sendEntrepreneurStatusChangeEmail(entrepreneur: Entrepreneur, oldStatus: string, newStatus: string): Promise<ServiceResponse<BatchEmailResult>>;
}