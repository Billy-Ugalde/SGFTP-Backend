import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Entrepreneur, EntrepreneurStatus } from '../entities/entrepreneur.entity';
import { Entrepreneurship } from '../entities/entrepreneurship.entity';
import { Person } from '../../../entities/person.entity';
import { CreateEntrepreneurDto, UpdateEntrepreneurDto, UpdateStatusDto, ToggleActiveDto } from '../dto/entrepreneur.dto';

@Injectable()
export class EntrepreneurService {
  constructor(
    @InjectRepository(Entrepreneur)
    private entrepreneurRepository: Repository<Entrepreneur>,
    @InjectRepository(Entrepreneurship)
    private entrepreneurshipRepository: Repository<Entrepreneurship>,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    private dataSource: DataSource,
  ) {}

 
  async findAllApproved(): Promise<Entrepreneur[]> {
    return await this.entrepreneurRepository.find({
      where: [
        { status: EntrepreneurStatus.APPROVED, is_active: true },
        { status: EntrepreneurStatus.APPROVED, is_active: false }
      ],
      relations: ['person', 'entrepreneurship'],
      order: {
        registration_date: 'DESC'
      }
    });
  }


  async findAllPending(): Promise<Entrepreneur[]> {
    return await this.entrepreneurRepository.find({
      where: { status: EntrepreneurStatus.PENDING },
      relations: ['person', 'entrepreneurship'],
      order: {
        registration_date: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Entrepreneur> {
    const entrepreneur = await this.entrepreneurRepository.findOne({
      where: { id_entrepreneur: id },
      relations: ['person', 'entrepreneurship']
    });

    if (!entrepreneur) {
      throw new NotFoundException(`Emprendedor con ID ${id} no encontrado`);
    }

    return entrepreneur;
  }

 
  async create(createDto: CreateEntrepreneurDto): Promise<Entrepreneur> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    
      const existingPerson = await this.personRepository.findOne({
        where: { email: createDto.email }
      });

      if (existingPerson) {
        throw new ConflictException('Ya existe una persona con este email');
      }

     
      const person = this.personRepository.create({
        first_name: createDto.first_name,
        second_name: createDto.second_name,
        first_lastname: createDto.first_lastname,
        second_lastname: createDto.second_lastname,
        email: createDto.email,
        phone_number: createDto.phone_number,
      });

      const savedPerson = await queryRunner.manager.save(Person, person);

     
      const entrepreneur = this.entrepreneurRepository.create({
        experience: createDto.experience,
        status: EntrepreneurStatus.PENDING,
        is_active: true,
        person: savedPerson,
      });

      const savedEntrepreneur = await queryRunner.manager.save(Entrepreneur, entrepreneur);

      
      const entrepreneurship = this.entrepreneurshipRepository.create({
        name: createDto.entrepreneurship_name,
        description: createDto.description,
        location: createDto.location,
        category: createDto.category,
        approach: createDto.approach,
        url_1: createDto.url_1,
        url_2: createDto.url_2,
        url_3: createDto.url_3,
        entrepreneur: savedEntrepreneur,
      });

      await queryRunner.manager.save(Entrepreneurship, entrepreneurship);

      await queryRunner.commitTransaction();

      
      return await this.findOne(savedEntrepreneur.id_entrepreneur);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  
  async update(id: number, updateDto: UpdateEntrepreneurDto): Promise<Entrepreneur> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entrepreneur = await this.findOne(id);

      
      if (updateDto.first_name || updateDto.second_name || updateDto.first_lastname || 
          updateDto.second_lastname || updateDto.email || updateDto.phone_number) {
        
        
        if (updateDto.email && updateDto.email !== entrepreneur.person.email) {
          const existingPerson = await this.personRepository.findOne({
            where: { email: updateDto.email }
          });

          if (existingPerson && existingPerson.id_person !== entrepreneur.person.id_person) {
            throw new ConflictException('Ya existe otra persona con este email');
          }
        }

        await queryRunner.manager.update(Person, entrepreneur.person.id_person, {
          ...(updateDto.first_name && { first_name: updateDto.first_name }),
          ...(updateDto.second_name !== undefined && { second_name: updateDto.second_name }),
          ...(updateDto.first_lastname && { first_lastname: updateDto.first_lastname }),
          ...(updateDto.second_lastname && { second_lastname: updateDto.second_lastname }),
          ...(updateDto.email && { email: updateDto.email }),
          ...(updateDto.phone_number && { phone_number: updateDto.phone_number }),
        });
      }

      
      if (updateDto.experience !== undefined) {
        await queryRunner.manager.update(Entrepreneur, id, {
          experience: updateDto.experience
        });
      }

      
      if (updateDto.entrepreneurship_name || updateDto.description || updateDto.location || 
          updateDto.category || updateDto.approach || updateDto.url_1 !== undefined || 
          updateDto.url_2 !== undefined || updateDto.url_3 !== undefined) {
        
        await queryRunner.manager.update(Entrepreneurship, entrepreneur.entrepreneurship.id_entrepreneurship, {
          ...(updateDto.entrepreneurship_name && { name: updateDto.entrepreneurship_name }),
          ...(updateDto.description && { description: updateDto.description }),
          ...(updateDto.location && { location: updateDto.location }),
          ...(updateDto.category && { category: updateDto.category }),
          ...(updateDto.approach && { approach: updateDto.approach }),
          ...(updateDto.url_1 !== undefined && { url_1: updateDto.url_1 }),
          ...(updateDto.url_2 !== undefined && { url_2: updateDto.url_2 }),
          ...(updateDto.url_3 !== undefined && { url_3: updateDto.url_3 }),
        });
      }

      await queryRunner.commitTransaction();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

 
  async updateStatus(id: number, statusDto: UpdateStatusDto): Promise<Entrepreneur> {
    const entrepreneur = await this.findOne(id);

    
    if (entrepreneur.status !== EntrepreneurStatus.PENDING) {
      throw new BadRequestException(`Solo se pueden aprobar o rechazar solicitudes pendientes`);
    }

    entrepreneur.status = statusDto.status;
    
    
    if (statusDto.status === EntrepreneurStatus.APPROVED) {
      entrepreneur.is_active = true;
    }

    await this.entrepreneurRepository.save(entrepreneur);

    return await this.findOne(id);
  }

  
  async toggleActive(id: number, toggleDto: ToggleActiveDto): Promise<Entrepreneur> {
    const entrepreneur = await this.findOne(id);

    
    if (entrepreneur.status !== EntrepreneurStatus.APPROVED) {
      throw new BadRequestException('Solo se pueden activar/inactivar emprendedores aprobados');
    }

    entrepreneur.is_active = toggleDto.active;
    
    
    if (toggleDto.active) {
      entrepreneur.status = EntrepreneurStatus.APPROVED;
    }

    await this.entrepreneurRepository.save(entrepreneur);

    return await this.findOne(id);
  }
}