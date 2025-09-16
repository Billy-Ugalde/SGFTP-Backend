import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Fair } from '../entities/fair.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { fairDto } from '../dto/createFair.dto';
import { UpdatefairDto } from '../dto/updateFair.dto';
import { fairStatusDto } from '../dto/fair-status.dto';
import { StandService } from './stand.service';
import { FairNotificationService } from '../../notifications/services/fair-notification.service';
@Injectable()
export class FairService {
  constructor(
    @InjectRepository(Fair)
    private fairRepository: Repository<Fair>,
    private standService: StandService,
    private dataSource: DataSource,
    private fairNotificationService: FairNotificationService,
  ) {}

  async create(createfairDto: fairDto): Promise<Fair> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingFair = await queryRunner.manager.findOne(Fair, {
        where: {
          name: createfairDto.name,
          date: new Date(createfairDto.date),
        },
      });
      if (existingFair) {
        throw new ConflictException(
          'Ya existe una feria con el mismo nombre y fecha. Por favor, verifica los datos e intenta nuevamente.',
        );
      }

      const newfair = queryRunner.manager.create(Fair, {
        ...createfairDto,
        date: new Date(createfairDto.date), // Convierte el stirng al tipo de dato date antes de enviar a la base de datos
      });

      const savedfair = await queryRunner.manager.save(Fair, newfair);

      await this.standService.createInitialStands(
        savedfair.id_fair,
        savedfair.stand_capacity,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return savedfair;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        if (error.message.includes('Duplicate entry')) {
          throw new ConflictException(
            'Ya existe una feria con el mismo nombre y fecha. Por favor, verifica los datos e intenta nuevamente.',
          );
        }
      }
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al crear la feria',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getAll() {
    return await this.fairRepository.find();
  }

  async getOne(id_fair: number): Promise<Fair> {
    const fair = await this.fairRepository.findOne({ where: { id_fair } });

    if (!fair) {
      throw `La feria con el id ${id_fair} no fue encontrada`;
    }
    return fair;
  }

  async update(id_fair: number, updateFair: UpdatefairDto) {

    const oldFair = await this.getOne(id_fair);

    await this.fairRepository.update({ id_fair }, updateFair);
    if (updateFair.stand_capacity !== undefined) {
      await this.standService.adjustStandsToCapacity(
        id_fair,
        updateFair.stand_capacity,
      );
    }
    
    const updatedFair = await this.getOne(id_fair);

    try {
      await this.fairNotificationService.sendFairChangeEmails(
        oldFair,
        updatedFair,
      );
      console.log(`Notificaciones enviadas para la feria: ${updatedFair.name}`);
    } catch (error) {
      console.error('Error enviando notificaciones:', error);
    }

    return updatedFair;
  }

  async updateStatus(id_fair: number, fairStatus: fairStatusDto) {
    const oldFair = await this.getOne(id_fair);

    const fair = await this.fairRepository.findOne({ where: { id_fair } });

    if (!fair) {
      throw `La feria con el id ${id_fair} no fue encontrada`;
    }
    await this.fairRepository.update(id_fair, fairStatus);

    const updatedFair = await this.getOne(id_fair);

    try {
      await this.fairNotificationService.sendFairChangeEmails(
        oldFair,
        updatedFair,
      );
      console.log(
        `Notificaciones de estado enviadas para: ${updatedFair.name}`,
      );
    } catch (error) {
      console.error('Error enviando notificaciones:', error);
    }

    return updatedFair;
  }
}
