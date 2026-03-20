import { Module } from '@nestjs/common';
import { EntrepreneurNotificationService } from './services/entrepreneur-notification.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [EntrepreneurNotificationService],
  exports: [EntrepreneurNotificationService],
})
export class EntrepreneurNotificationsModule {}
