import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { Volunteer } from './entities/volunteer.entitie';
import { Activity_enrollment } from './entities/enrollmentActivity.entitie';
import { AuthModule } from '../auth/auth.module';
import { Person } from 'src/entities/person.entity';
import { Phone } from 'src/entities/phone.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volunteer,
      Activity_enrollment,
      Person,
      Phone,
      User,
      Role
    ]),
    AuthModule
  ],
  controllers: [VolunteerController],
  providers: [VolunteerService],
  exports: [VolunteerService]
})
export class VolunteerModule {}
