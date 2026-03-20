import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './services/notification.service';
import { FairNotificationService } from './services/fair-notification.service';
import { User } from '../users/entities/user.entity';
import { Fair_enrollment } from '../fairs/entities/Fair_enrollment.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Fair_enrollment]), SharedModule],
  providers: [NotificationService, FairNotificationService],
  exports: [FairNotificationService, NotificationService],
})
export class NotificationsModule {}
