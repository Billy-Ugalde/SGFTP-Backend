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
      let donor = await queryRunner.manager.findOne(Donor, {
        where: { email: createDonationDto.email }
      });

      if (!donor) {
        donor = queryRunner.manager.create(Donor, {
          firstName: createDonationDto.firstName,
          secondName: createDonationDto.secondName,
          nameCompany: createDonationDto.nameCompany,
          firstLastName: createDonationDto.firstLastName,
          secondLastName: createDonationDto.secondLastName,
          donorType: createDonationDto.donorType,
          interest: createDonationDto.interest,
          email: createDonationDto.email,
          phone: createDonationDto.phone,
        });
        donor = await queryRunner.manager.save(Donor, donor);
      }

      const newDonation = queryRunner.manager.create(Donation, {
        donor: donor,
        donationType: createDonationDto.donationType,
        donationDetails: createDonationDto.donationDetails,
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
      order: { createdAt: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Donation> {
    const donation = await this.donationRepository.findOne({ 
      where: { idDonation: id },
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
        where: { idDonation: id },
        relations: ['donor']
      });
      
      if (!donation) {
        throw new NotFoundException(`Donation with ID ${id} not found`);
      }

      if (updateDonationDto.donationType) donation.donationType = updateDonationDto.donationType;
      if (updateDonationDto.donationDetails) donation.donationDetails = updateDonationDto.donationDetails;
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
    const donation = await this.donationRepository.findOne({ where: { idDonation: id } });
    
    if (!donation) {
      throw new NotFoundException(`Donation with ID ${id} not found`);
    }

    donation.archived = !donation.archived;
    return await this.donationRepository.save(donation);
  }
}
