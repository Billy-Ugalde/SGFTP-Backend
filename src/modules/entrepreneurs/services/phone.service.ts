import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { Phone } from '../../../entities/phone.entity';
import { CreatePhoneDto, UpdatePhoneDto } from '../dto/phone.dto';

@Injectable()
export class PhoneService {
  constructor(
    @InjectRepository(Phone)
    private phoneRepository: Repository<Phone>,
  ) {}

  async createPhonesForPerson(
    personId: number, 
    phonesDto: CreatePhoneDto[], 
    queryRunner: QueryRunner
  ): Promise<Phone[]> {
    const phones = phonesDto.map((phoneDto, index) => {
      const phone = this.phoneRepository.create({
        ...phoneDto,
        id_person: personId,
        // El primer teléfono será el primario si no se especifica otro
        is_primary: phoneDto.is_primary ?? (index === 0)
      });
      return phone;
    });

    return await queryRunner.manager.save(Phone, phones);
  }

  async updatePhonesForPerson(
    personId: number, 
    phonesDto: UpdatePhoneDto[], 
    queryRunner: QueryRunner
  ): Promise<Phone[]> {
    // Eliminar teléfonos existentes
    await queryRunner.manager.delete(Phone, { id_person: personId });
    
    // Crear nuevos teléfonos
    const phones = phonesDto.map((phoneDto, index) => {
      const phone = this.phoneRepository.create({
        ...phoneDto,
        id_person: personId,
        is_primary: phoneDto.is_primary ?? (index === 0)
      });
      return phone;
    });

    return await queryRunner.manager.save(Phone, phones);
  }

  async findByPersonId(personId: number): Promise<Phone[]> {
    return await this.phoneRepository.find({
      where: { id_person: personId },
      order: { is_primary: 'DESC', created_at: 'ASC' }
    });
  }
}