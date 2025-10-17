import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';
import { Volunteer } from './entities/volunteer.entitie';
import { Activity_enrollment } from './entities/enrollmentActivity.entitie';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Volunteer, Activity_enrollment]),
    AuthModule
  ],
  controllers: [VolunteerController],
  providers: [VolunteerService],
  exports: [VolunteerService]
})
export class VolunteerModule {}
