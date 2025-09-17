import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Entrepreneur, EntrepreneurStatus } from '../entities/entrepreneur.entity';
import { CreateCompleteEntrepreneurDto, UpdateCompleteEntrepreneurDto } from '../dto/complete-entrepreneur.dto';
import { ToggleActiveDto, UpdateStatusDto } from '../dto/entrepreneur.dto';
import { PersonService } from '../../person/services/person.service';
import { EntrepreneurshipService } from './entrepreneurship.service';
import { AuthService } from '../../auth/services/auth.service';
import { Person } from '../../../entities/person.entity';
import { Entrepreneurship } from '../entities/entrepreneurship.entity';
import { AccountInvitationService } from '../../auth/services/account-invitation.service';
import { Role } from '../../users/entities/role.entity';

@Injectable()
export class EntrepreneurService {
  constructor(
    @InjectRepository(Entrepreneur)
    private entrepreneurRepository: Repository<Entrepreneur>,
    private personService: PersonService,
    private entrepreneurshipService: EntrepreneurshipService,
    private dataSource: DataSource,
    private authService: AuthService,
    private accountInvitationService: AccountInvitationService,
  ) { }


  async findAllApproved(): Promise<Entrepreneur[]> {
    return await this.entrepreneurRepository.find({
      where: [
        { status: EntrepreneurStatus.APPROVED, is_active: true },
        { status: EntrepreneurStatus.APPROVED, is_active: false }
      ],
      relations: ['person', 'person.phones', 'entrepreneurship'],
      order: {
        registration_date: 'DESC'
      }
    });
  }


  async findAllPending(): Promise<Entrepreneur[]> {
    return await this.entrepreneurRepository.find({
      where: { status: EntrepreneurStatus.PENDING },
      relations: ['person', 'person.phones', 'entrepreneurship'],
      order: {
        registration_date: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Entrepreneur> {
    const entrepreneur = await this.entrepreneurRepository.findOne({
      where: { id_entrepreneur: id },
      relations: ['person', 'person.phones', 'entrepreneurship']
    });

    if (!entrepreneur) {
      throw new NotFoundException(`Emprendedor con ID ${id} no encontrado`);
    }

    return entrepreneur;
  }


  async create(createDto: CreateCompleteEntrepreneurDto, request?: any): Promise<Entrepreneur> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      const savedPerson = await this.personService.create(createDto.person, queryRunner);

      // Determinar estado inicial basado en si hay usuario autenticado y sus roles
    let initialStatus = EntrepreneurStatus.PENDING; 
    
    if (request?.user) {
      const user = request.user;
      const userRoles = user.getAllRoleNames();
      
      // Si es admin, aprobar automáticamente
      if (userRoles.some(role => ['super_admin', 'general_admin', 'fair_admin'].includes(role))) {
        initialStatus = EntrepreneurStatus.APPROVED;
      }
    }


      const entrepreneur = this.entrepreneurRepository.create({
        experience: createDto.entrepreneur.experience,
        facebook_url: createDto.entrepreneur.facebook_url,
        instagram_url: createDto.entrepreneur.instagram_url,
        status: initialStatus,
        is_active: false,
        person: savedPerson,
      });

      const savedEntrepreneur = await queryRunner.manager.save(Entrepreneur, entrepreneur);

      // Crear el emprendimiento
      await this.entrepreneurshipService.create(
        savedEntrepreneur.id_entrepreneur,
        createDto.entrepreneurship,
        queryRunner
      );

      await queryRunner.commitTransaction();

      return await this.findOne(savedEntrepreneur.id_entrepreneur);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async update(id: number, updateDto: UpdateCompleteEntrepreneurDto): Promise<Entrepreneur> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entrepreneur = await this.findOne(id);

      if (updateDto.person) {
        await this.personService.update(entrepreneur.person.id_person, updateDto.person, queryRunner);
      }

      if (updateDto.entrepreneur) {
        const updateData: Partial<Entrepreneur> = {};

        if (updateDto.entrepreneur.experience !== undefined) {
          updateData.experience = updateDto.entrepreneur.experience;
        }
        if (updateDto.entrepreneur.facebook_url !== undefined) {
          updateData.facebook_url = updateDto.entrepreneur.facebook_url;
        }
        if (updateDto.entrepreneur.instagram_url !== undefined) {
          updateData.instagram_url = updateDto.entrepreneur.instagram_url;
        }

        if (Object.keys(updateData).length > 0) {
          await queryRunner.manager.update(Entrepreneur, id, updateData);
        }
      }

      if (updateDto.entrepreneurship) {
        await this.entrepreneurshipService.update(
          entrepreneur.entrepreneurship.id_entrepreneurship,
          updateDto.entrepreneurship,
          queryRunner
        );
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

      // ===== TRANSACCIÓN PARA MANTENER CONSISTENCIA =====
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
          // 1. Actualizar estado de entrepreneur
          entrepreneur.status = statusDto.status;

          await queryRunner.manager.save(Entrepreneur, entrepreneur);

          // 2. Crear cuenta de usuario SI es aprobado
          if (statusDto.status === EntrepreneurStatus.APPROVED) {
            // Obtener rol de emprendedor
            const entrepreneurRole = await queryRunner.manager.findOne(Role, { 
              where: { name: 'entrepreneur' } 
            });
            
            if (!entrepreneurRole) {
              throw new NotFoundException('Rol entrepreneur no encontrado');
            }
            
            // Delegar creación de cuenta al AccountInvitationService
            await this.accountInvitationService.createUserAccount(
              entrepreneur.person.id_person,
              [entrepreneurRole.id_role],
              0, // Sistema (sin admin específico)
              queryRunner
            );
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

  async remove(id: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const entrepreneur = await this.entrepreneurRepository
        .createQueryBuilder('entrepreneur')
        .leftJoinAndSelect('entrepreneur.person', 'person')
        .leftJoinAndSelect('entrepreneur.entrepreneurship', 'entrepreneurship')
        .where('entrepreneur.id_entrepreneur = :id', { id })
        .getOne();

      if (!entrepreneur) {
        throw new NotFoundException(`Emprendedor con ID ${id} no encontrado`);
      }

      if (entrepreneur.status !== EntrepreneurStatus.PENDING) {
        throw new BadRequestException(`Solo se pueden eliminar emprendedores con estado 'pending'`);
      }

      if (entrepreneur.entrepreneurship) {
        await queryRunner.manager.delete(Entrepreneurship, entrepreneur.entrepreneurship.id_entrepreneurship);
      }
      if (entrepreneur.person) {
        await queryRunner.manager.delete(Person, entrepreneur.person.id_person);
      }

      await queryRunner.manager.delete(Entrepreneur, entrepreneur.id_entrepreneur);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }



}