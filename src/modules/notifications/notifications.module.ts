import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './services/notification.service';
import { FairNotificationService } from './services/fair-notification.service';
import { TemplateService } from './services/template.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User])
  ],
  providers: [
    NotificationService, 
    FairNotificationService,
    TemplateService
  ],
  exports: [
    FairNotificationService,
    NotificationService
  ],
})
export class NotificationsModule {}