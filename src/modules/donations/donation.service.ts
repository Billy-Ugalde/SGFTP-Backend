import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Donor } from './entities/donor.entity';
import { Donation } from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(Donor)
    private donorRepository: Repository<Donor>,
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    private dataSource: DataSource,
  ) {}

  async create(createDonationDto: CreateDonationDto): Promise<Donation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Buscar o crear donante
      let donor = await queryRunner.manager.findOne(Donor, {
        where: {
          Email: createDonationDto.Email,
        }
      });

      if (!donor) {
        donor = queryRunner.manager.create(Donor, {
          first_name: createDonationDto.first_name,
          second_name: createDonationDto.second_name,
          first_lastname: createDonationDto.first_lastname,
          second_lastname: createDonationDto.second_lastname,
          Interest: createDonationDto.Interest,
          Email: createDonationDto.Email,
          Phone: createDonationDto.Phone,
        });
        donor = await queryRunner.manager.save(Donor, donor);
      }

      // Crear donación
      const newDonation = queryRunner.manager.create(Donation, {
        donor: donor,
        Donation_type: createDonationDto.Donation_type,
        Donation_details: createDonationDto.Donation_details,
      });
      const savedDonation = await queryRunner.manager.save(Donation, newDonation);

      await queryRunner.commitTransaction();
      return savedDonation;

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        throw new ConflictException('Error al crear la donación');
      }

      throw new InternalServerErrorException('Error interno del servidor al crear la donación');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Donation[]> {
    return await this.donationRepository.find({
      relations: ['donor'],
      order: { Created_at: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Donation> {
    const donation = await this.donationRepository.findOne({ 
      where: { Id_donation: id },
      relations: ['donor']
    });
    
    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found`);
    }
    
    return donation;
  }

  async update(id: number, updateDonationDto: UpdateDonationDto): Promise<Donation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const donation = await queryRunner.manager.findOne(Donation, { 
        where: { Id_donation: id },
        relations: ['donor']
      });
      
      if (!donation) {
        throw new NotFoundException(`Donation with ID ${id} not found`);
      }

      // Actualizar donación
      if (updateDonationDto.Donation_type) donation.Donation_type = updateDonationDto.Donation_type;
      if (updateDonationDto.Donation_details) donation.Donation_details = updateDonationDto.Donation_details;
      if (updateDonationDto.status) donation.status = updateDonationDto.status;

      const updatedDonation = await queryRunner.manager.save(Donation, donation);

      await queryRunner.commitTransaction();
      return updatedDonation;

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Error interno del servidor al actualizar la donación');
    } finally {
      await queryRunner.release();
    }
  }

  async archive(id: number): Promise<Donation> {
    const donation = await this.donationRepository.findOne({ where: { Id_donation: id } });
    
    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found`);
    }

    donation.archived = !donation.archived;
    return await this.donationRepository.save(donation);
  }
}
