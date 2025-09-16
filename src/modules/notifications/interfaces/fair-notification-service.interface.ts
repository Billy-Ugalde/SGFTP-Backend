import { 
  ChangeInfo, 
  BatchEmailResult, 
  ServiceResponse, 
  UserEmailData, 
  BatchConfig 
} from './notification.interface';
import { Fair } from '../../fairs/entities/fair.entity';
import { User } from '../../users/entities/user.entity';

export interface IFairNotificationService {
  sendFairChangeEmailsAsync(oldFair: Fair, newFair: Fair): Promise<void>;
  sendFairChangeEmails(oldFair: Fair, newFair: Fair): Promise<ServiceResponse<BatchEmailResult>>;
  validateUsers(users: User[]): Promise<UserEmailData[]>;
  detectStatusChange(oldFair: Fair, newFair: Fair): boolean;
  detectContentChanges(oldFair: Fair, newFair: Fair): ChangeInfo[];
  sendEmailsInBatches(
    users: User[],
    oldFair: Fair,
    newFair: Fair,
    hasStatusChange: boolean,
    contentChanges: ChangeInfo[],
    batchConfig?: BatchConfig
  ): Promise<BatchEmailResult>;
}