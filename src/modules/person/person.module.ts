import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from '../../entities/person.entity';
import { PersonService } from './services/person.service';
import { PersonController } from './controllers/person.controller';
import { PhoneService } from './services/phone.service'; 
import { Phone } from '../../entities/phone.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Person, Phone]), 
  ],
  controllers: [PersonController],
  providers: [
    PersonService, 
    PhoneService 
  ],
  exports: [PersonService], 
})
export class PersonModule {}