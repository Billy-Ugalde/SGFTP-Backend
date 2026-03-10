import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { Person } from '../../../entities/person.entity';
import { CreatePersonDto, UpdatePersonDto } from '../dto/person.dto';
import { normalizePhone, normalizePhoneOptional } from '../../../common/phone/phone.util';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
  ) {}

  private buildPersonEntity(createDto: CreatePersonDto): Person {
    return this.personRepository.create({
      first_name: createDto.first_name,
      second_name: createDto.second_name,
      first_lastname: createDto.first_lastname,
      second_lastname: createDto.second_lastname,
      email: createDto.email,
      phone_primary: normalizePhone(createDto.phone_primary),
      phone_secondary: normalizePhoneOptional(createDto.phone_secondary),
    });
  }

  async create(createDto: CreatePersonDto, queryRunner: QueryRunner): Promise<Person> {
    const existingPerson = await this.personRepository.findOne({
      where: { email: createDto.email }
    });

    if (existingPerson) {
      throw new ConflictException('Ya existe una persona con este email');
    }

    const person = this.buildPersonEntity(createDto);
    const savedPerson = await queryRunner.manager.save(Person, person);

    return savedPerson;
  }

  async findOrCreate(createDto: CreatePersonDto, queryRunner: QueryRunner): Promise<{
    person: Person;
    isNew: boolean;
  }> {
    const existingPerson = await this.personRepository.findOne({
      where: { email: createDto.email }
    });

    if (existingPerson) {
      const updateData: Partial<Person> = {};

      if (createDto.first_name && createDto.first_name !== existingPerson.first_name) {
        updateData.first_name = createDto.first_name;
      }
      if (createDto.second_name !== existingPerson.second_name) {
        updateData.second_name = createDto.second_name;
      }
      if (createDto.first_lastname && createDto.first_lastname !== existingPerson.first_lastname) {
        updateData.first_lastname = createDto.first_lastname;
      }
      if (createDto.second_lastname !== existingPerson.second_lastname) {
        updateData.second_lastname = createDto.second_lastname;
      }
      if (createDto.phone_primary && createDto.phone_primary !== existingPerson.phone_primary) {
        updateData.phone_primary = normalizePhone(createDto.phone_primary);
      }
      if (createDto.phone_secondary !== existingPerson.phone_secondary) {
        updateData.phone_secondary = normalizePhoneOptional(createDto.phone_secondary);
      }

      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Person, existingPerson.id_person, updateData);

        const updatedPerson = await queryRunner.manager.findOne(Person, {
          where: { id_person: existingPerson.id_person }
        });
        return { person: updatedPerson!, isNew: false };
      }

      return { person: existingPerson, isNew: false };
    }

    const person = this.buildPersonEntity(createDto);
    const savedPerson = await queryRunner.manager.save(Person, person);

    return { person: savedPerson, isNew: true };
  }

  async update(
    personId: number,
    updateDto: UpdatePersonDto,
    queryRunner: QueryRunner
  ): Promise<void> {
    if (updateDto.email) {
      const existingPerson = await this.personRepository.findOne({
        where: { email: updateDto.email }
      });

      if (existingPerson && existingPerson.id_person !== personId) {
        throw new ConflictException('Ya existe otra persona con este email');
      }
    }

    const updateData: Partial<Person> = {};
    if (updateDto.first_name) updateData.first_name = updateDto.first_name;
    if (updateDto.second_name !== undefined) updateData.second_name = updateDto.second_name;
    if (updateDto.first_lastname) updateData.first_lastname = updateDto.first_lastname;
    if (updateDto.second_lastname) updateData.second_lastname = updateDto.second_lastname;
    if (updateDto.email) updateData.email = updateDto.email;
    if (updateDto.phone_primary) updateData.phone_primary = normalizePhone(updateDto.phone_primary);
    if (updateDto.phone_secondary !== undefined) updateData.phone_secondary = normalizePhoneOptional(updateDto.phone_secondary);

    if (Object.keys(updateData).length > 0) {
      await queryRunner.manager.update(Person, personId, updateData);
    }
  }

  async findById(id: number): Promise<Person | null> {
    return await this.personRepository.findOne({
      where: { id_person: id }
    });
  }

  async findAll(): Promise<Person[]> {
    return await this.personRepository.find({
      order: {
        created_at: 'DESC'
      }
    });
  }

  async delete(id: number): Promise<void> {
    const person = await this.findById(id);

    if (!person) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }
    await this.personRepository.delete(id);
  }

}