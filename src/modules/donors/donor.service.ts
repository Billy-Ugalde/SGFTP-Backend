import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Donor } from './entities/donor.entity';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';

@Injectable()
export class DonorService {
  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    private dataSource: DataSource,
  ) {}

  async create(createDonorDto: CreateDonorDto): Promise<Donor> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validación para evitar duplicados
      const existingDonor = await queryRunner.manager.findOne(Donor, {
        where: {
          first_name: createDonorDto.first_name,
          first_lastname: createDonorDto.first_lastname,
          Donation_details: createDonorDto.Donation_details
        }
      });

      if (existingDonor) {
        throw new ConflictException(
          'Ya existe un donador con los mismos datos. Por favor, verifica e intenta nuevamente.',
        );
      }

      const newDonor = queryRunner.manager.create(Donor, createDonorDto);
      const savedDonor = await queryRunner.manager.save(Donor, newDonor);

      await queryRunner.commitTransaction();
      return savedDonor;

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        if (error.message.includes('Duplicate entry')) {
          throw new ConflictException(
            'Ya existe un donador con los mismos datos. Por favor, verifica e intenta nuevamente.',
          );
        }
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al crear el donador',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Donor[]> {
    return await this.donorRepository.find({
      order: { Created_at: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { Id_donor: id } });
    
    if (!donor) {
      throw new NotFoundException(`Donor with ID ${id} not found`);
    }
    
    return donor;
  }

  async update(id: number, updateDonorDto: UpdateDonorDto): Promise<Donor> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const donor = await queryRunner.manager.findOne(Donor, { where: { Id_donor: id } });
      
      if (!donor) {
        throw new NotFoundException(`Donor with ID ${id} not found`);
      }

      Object.assign(donor, updateDonorDto);
      const updatedDonor = await queryRunner.manager.save(Donor, donor);

      await queryRunner.commitTransaction();
      return updatedDonor;

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        if (error.message.includes('Duplicate entry')) {
          throw new ConflictException(
            'Ya existe un donador con los mismos datos. Por favor, verifica e intenta nuevamente.',
          );
        }
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al actualizar el donador',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async archive(id: number): Promise<Donor> {
    const donor = await this.donorRepository.findOne({ where: { Id_donor: id } });
    
    if (!donor) {
      throw new NotFoundException(`Donor with ID ${id} not found`);
    }

    donor.archived = !donor.archived;
    return await this.donorRepository.save(donor);
  }
}
