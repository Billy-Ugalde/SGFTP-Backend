import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EntrepreneurNotificationService } from './services/entrepreneur-notification.service';
import { EntrepreneurTemplateService } from './services/entrepreneur-template.service';
import { EntrepreneurEmailService } from './services/entrepreneur-email.service';

@Module({
  imports: [ConfigModule],
  providers: [
    EntrepreneurNotificationService, 
    EntrepreneurTemplateService, 
    EntrepreneurEmailService
  ],
  exports: [EntrepreneurNotificationService],
})
export class EntrepreneurNotificationsModule {}