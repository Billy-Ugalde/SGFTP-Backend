import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './services/notification.service';
import { FairNotificationService } from './services/fair-notification.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User])
  ],
  providers: [NotificationService, FairNotificationService],
  exports: [FairNotificationService],
})
export class NotificationsModule {}