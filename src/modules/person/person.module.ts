import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from '../../entities/person.entity';
import { PersonService } from './services/person.service';
import { PersonController } from './controllers/person.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Person]),
  ],
  controllers: [PersonController],
  providers: [
    PersonService,
  ],
  exports: [PersonService],
})
export class PersonModule {}