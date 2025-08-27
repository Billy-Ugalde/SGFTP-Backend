import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { Person } from '../../../entities/person.entity';
import { CreatePersonDto, UpdatePersonDto } from '../dto/person.dto';
import { PhoneService } from './phone.service';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    private phoneService: PhoneService,
  ) {}

  async create(createDto: CreatePersonDto, queryRunner: QueryRunner): Promise<Person> {
    // Verificar si ya existe una persona con ese email
    const existingPerson = await this.personRepository.findOne({
      where: { email: createDto.email }
    });

    if (existingPerson) {
      throw new ConflictException('Ya existe una persona con este email');
    }

    // Crear la persona
    const person = this.personRepository.create({
      first_name: createDto.first_name,
      second_name: createDto.second_name,
      first_lastname: createDto.first_lastname,
      second_lastname: createDto.second_lastname,
      email: createDto.email,
    });

    const savedPerson = await queryRunner.manager.save(Person, person);

    // Crear los teléfonos
    await this.phoneService.createPhonesForPerson(
      savedPerson.id_person, 
      createDto.phones, 
      queryRunner
    );

    return savedPerson;
  }

  async update(
    personId: number, 
    updateDto: UpdatePersonDto, 
    queryRunner: QueryRunner
  ): Promise<void> {
    // Verificar email único si se está actualizando
    if (updateDto.email) {
      const existingPerson = await this.personRepository.findOne({
        where: { email: updateDto.email }
      });

      if (existingPerson && existingPerson.id_person !== personId) {
        throw new ConflictException('Ya existe otra persona con este email');
      }
    }

    // Actualizar datos básicos de la persona
    const updateData: Partial<Person> = {};
    if (updateDto.first_name) updateData.first_name = updateDto.first_name;
    if (updateDto.second_name !== undefined) updateData.second_name = updateDto.second_name;
    if (updateDto.first_lastname) updateData.first_lastname = updateDto.first_lastname;
    if (updateDto.second_lastname) updateData.second_lastname = updateDto.second_lastname;
    if (updateDto.email) updateData.email = updateDto.email;

    if (Object.keys(updateData).length > 0) {
      await queryRunner.manager.update(Person, personId, updateData);
    }

    // Actualizar teléfonos si se proporcionan
    if (updateDto.phones && updateDto.phones.length > 0) {
      await this.phoneService.updatePhonesForPerson(personId, updateDto.phones, queryRunner);
    }
  }

  async findById(id: number): Promise<Person | null> {
    return await this.personRepository.findOne({
      where: { id_person: id },
      relations: ['phones']
    });
  }
}