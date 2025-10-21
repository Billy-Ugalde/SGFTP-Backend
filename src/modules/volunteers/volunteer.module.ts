import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerController } from './controllers/volunteer.controller';
import { VolunteerService } from './services/volunteer.service';
import { Volunteer } from './entities/volunteer.entitie';
import { Activity_enrollment } from './entities/enrollmentActivity.entitie';
import { AuthModule } from '../auth/auth.module';
import { Person } from 'src/entities/person.entity';
import { Phone } from 'src/entities/phone.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Mailbox } from './entities/mailbox.entity';
import { MailboxController } from './controllers/mailbox.controller';
import { MailboxService } from './services/mailbox.service';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volunteer,
      Activity_enrollment,
      Person,
      Phone,
      User,
      Role,
      Mailbox
    ]),
    AuthModule
  ],
  controllers: [VolunteerController, MailboxController],
  providers: [VolunteerService, MailboxService, GoogleDriveService],
  exports: [VolunteerService]
})
export class VolunteerModule {}
