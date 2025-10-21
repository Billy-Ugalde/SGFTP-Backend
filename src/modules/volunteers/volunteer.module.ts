import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './services/volunteer.service';
import { Volunteer } from './entities/volunteer.entity';
import { Activity_enrollment } from './entities/enrollmentActivity.entity';
import { AuthModule } from '../auth/auth.module';
import { Person } from 'src/entities/person.entity';
import { Phone } from 'src/entities/phone.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { VOLUNTEER_REPOSITORY_TOKEN, ENROLLMENT_REPOSITORY_TOKEN } from './constants/injection-tokens';
import { Mailbox } from './entities/mailbox.entity';
import { SharedModule } from '../shared/shared.module';

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
    AuthModule,
    SharedModule
  ],
  controllers: [VolunteerController],
  providers: [
    // Provider para IVolunteerRepository
    {
      provide: VOLUNTEER_REPOSITORY_TOKEN,
      useFactory: (dataSource: DataSource) => {
        return dataSource.getRepository(Volunteer);
      },
      inject: [DataSource]
    },
    // Provider para IEnrollmentRepository
    {
      provide: ENROLLMENT_REPOSITORY_TOKEN,
      useFactory: (dataSource: DataSource) => {
        return dataSource.getRepository(Activity_enrollment);
      },
      inject: [DataSource]
    },
    // Service
    VolunteerService
  ],
  exports: [VolunteerService]
})
export class VolunteerModule {}
