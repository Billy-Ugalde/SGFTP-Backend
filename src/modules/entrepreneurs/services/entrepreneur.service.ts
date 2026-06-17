import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
import { GoogleDriveService } from '../../google-drive/google-drive.service';
import { UpdateEntrepreneurshipDto } from '../dto/entrepreneurship.dto';
import { ForbiddenException } from '@nestjs/common';
import { EntrepreneurNotificationService } from 'src/modules/entrepreneurs-notifications/services/entrepreneur-notification.service';
import { validateAndProcessImages } from 'src/common/utils/image-processor';
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
    private googleDriveService: GoogleDriveService,
    private entrepreneurNotificationService: EntrepreneurNotificationService,
  ) { }

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


  async create(createDto: CreateCompleteEntrepreneurDto, request?: any, files?: Express.Multer.File[],): Promise<Entrepreneur> {
    // Validar y optimizar todas las imágenes antes de abrir la transacción.
    files = await validateAndProcessImages(files);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { person: savedPerson, isNew: isNewPerson } = await this.personService.findOrCreate(createDto.person, queryRunner);

      const existingUser = await queryRunner.manager.findOne(Person, {
        where: { id_person: savedPerson.id_person },
        relations: ['user', 'user.roles']
      });

      const existingEntrepreneur = await this.entrepreneurRepository.findOne({
        where: { person: { id_person: savedPerson.id_person } }
      });

      if (existingEntrepreneur) {
        const status = existingEntrepreneur.status;
        if (status === EntrepreneurStatus.PENDING) {
          throw new BadRequestException(
            'Ya tienes una solicitud de emprendedor pendiente de aprobación. Por favor espera la revisión de tu solicitud.'
          );
        } else if (status === EntrepreneurStatus.APPROVED) {
          throw new BadRequestException(
            'Ya eres emprendedor aprobado. Inicia sesión para acceder a tu cuenta.'
          );
        } else if (status === EntrepreneurStatus.REJECTED) {
          throw new BadRequestException(
            'Tu solicitud anterior fue rechazada. Por favor contacta con un administrador para más información.'
          );
        }
      }

      let initialStatus = EntrepreneurStatus.PENDING;
      let createdEntrepreneur: Entrepreneur;
      let isAdminCreation = false;

      if (request?.user) {
        const user = request.user;
        const userRoles = user.getAllRoleNames();

        if (userRoles.some(role => ['super_admin', 'general_admin', 'fair_admin'].includes(role))) {
          initialStatus = EntrepreneurStatus.APPROVED;
          isAdminCreation = true;
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

      createdEntrepreneur = await queryRunner.manager.save(Entrepreneur, entrepreneur);

      let urls: string[] = [];
      let folderId: string | null = null;

      if (files && files.length > 0) {
        const folderName = `entrepreneur_${createdEntrepreneur.id_entrepreneur}`;
        for (const file of files) {
          const { url, folderId: fId } = await this.googleDriveService.uploadFile(file, folderName);
          urls.push(url);
          folderId = fId;
        }
      }

      await this.entrepreneurshipService.create(
        createdEntrepreneur.id_entrepreneur,
        {
          ...createDto.entrepreneurship,
          url_1: urls[0] || undefined,
          url_2: urls[1] || undefined,
          url_3: urls[2] || undefined,
        },
        queryRunner,
      );

      const entrepreneurRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'entrepreneur' }
      });

      if (!entrepreneurRole) {
        throw new NotFoundException('Rol entrepreneur no encontrado');
      }

      if (initialStatus === EntrepreneurStatus.APPROVED) {
        if (existingUser?.user) {
          const user = existingUser.user;
          if (!user.roles.some(r => r.name === 'entrepreneur')) {
            user.roles.push(entrepreneurRole);
            await queryRunner.manager.save(user);
          }
        } else {
          await this.accountInvitationService.createUserAccount(
            savedPerson.id_person,
            [entrepreneurRole.id_role],
            request?.user?.id ?? 0,
            queryRunner
          );
        }
      }

      await queryRunner.commitTransaction();
      return await this.findOne(createdEntrepreneur.id_entrepreneur);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async update(id: number, updateDto: UpdateCompleteEntrepreneurDto, files?: Express.Multer.File[],): Promise<Entrepreneur> {
    // Validar y optimizar las imágenes de reemplazo antes de abrir la transacción.
    files = await validateAndProcessImages(files);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entrepreneur = await this.findOne(id);
      const filesToDelete: string[] = [];
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

    let entrepreneurshipUpdateData = { ...updateDto.entrepreneurship };

    if (files && files.length > 0 && entrepreneurshipUpdateData) {
      const folderName = `entrepreneur_${entrepreneur.id_entrepreneur}`;
      const fileMapping: { [key: string]: Express.Multer.File } = {};
      let fileIndex = 0;

      for (const field of ['url_1', 'url_2', 'url_3'] as const) {
        const fieldValue = entrepreneurshipUpdateData[field];

        if (typeof fieldValue === 'string' && fieldValue.startsWith('__FILE_REPLACE_')) {
          if (fileIndex < files.length) {
            fileMapping[field] = files[fileIndex];
            fileIndex++;
          } else {
            delete entrepreneurshipUpdateData[field];
          }
        }
      }

      for (const [field, file] of Object.entries(fileMapping)) {
        const currentUrl = entrepreneur.entrepreneurship?.[field as keyof Entrepreneurship];

        if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
          const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
          if (fileId) {
            filesToDelete.push(fileId);
          }
        }

        try {
          const { url, folderId } = await this.googleDriveService.uploadFile(file, folderName);

          if (field === 'url_1' || field === 'url_2' || field === 'url_3') {
             entrepreneurshipUpdateData[field] = url;
          }
        } catch (uploadError) {
          throw new InternalServerErrorException(
            `Error subiendo imagen ${field}: ${uploadError.message || 'Error desconocido'}`
          );
        }
      }

      for (const field of ['url_1', 'url_2', 'url_3'] as const) {
        const value = entrepreneurshipUpdateData[field];
        if (typeof value === 'string' && value.startsWith('__FILE_REPLACE_')) {
          delete entrepreneurshipUpdateData[field];
        }
      }
    }

    if (entrepreneurshipUpdateData && Object.keys(entrepreneurshipUpdateData).length > 0) {
      await this.entrepreneurshipService.update(
        entrepreneur.entrepreneurship.id_entrepreneurship,
        entrepreneurshipUpdateData,
        queryRunner
      );
    }

    await queryRunner.commitTransaction();

    if (filesToDelete.length > 0) {
      Promise.all(
        filesToDelete.map(async (fileId) => {
          try {
            await this.googleDriveService.deleteFile(fileId);
          } catch (deleteError) {
            console.error(`No se pudo eliminar archivo ${fileId}:`, deleteError.message);
          }
        })
      ).catch(error => {
        console.error('Error en proceso de eliminación:', error);
      });
    }

    return await this.findOne(id);
    
  } catch (error) {
    await queryRunner.rollbackTransaction();

    if (error instanceof InternalServerErrorException) {
      throw error;
    }

    throw new InternalServerErrorException(
      `Error actualizando emprendedor: ${error.message || 'Error desconocido'}`
    );
  } finally {
    await queryRunner.release();
  }
}

  async updateIfOwnerAndEntrepreneurRole(
    id: number,
    dto: UpdateCompleteEntrepreneurDto,
    user: any,
    files?: Express.Multer.File[],
  ): Promise<Entrepreneur> {
    const entrepreneur = await this.findOne(id);

    const roleNames: string[] =
      (typeof user?.getAllRoleNames === 'function'
        ? user.getAllRoleNames()
        : user?.roles?.map((r: any) => r?.name)) || [];

    const hasEntrepreneurRole = roleNames.includes('entrepreneur');
    if (!hasEntrepreneurRole) {
      throw new ForbiddenException('No tiene permisos para actualizar este registro.');
    }

    const userPersonId = user?.person?.id_person;
    const isOwner =
      !!userPersonId &&
      (entrepreneur?.id_person === userPersonId ||
        entrepreneur?.person?.id_person === userPersonId);

    if (!isOwner) {
      throw new ForbiddenException('Solo el dueño puede actualizar su registro.');
    }

    return await this.update(id, dto, files);
  }
  

  async updateStatus(id: number, statusDto: UpdateStatusDto): Promise<Entrepreneur> {
    const entrepreneur = await this.findOne(id);

    if (entrepreneur.status !== EntrepreneurStatus.PENDING) {
      throw new BadRequestException(`Solo se pueden aprobar o rechazar solicitudes pendientes`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      entrepreneur.status = statusDto.status;
      await queryRunner.manager.save(Entrepreneur, entrepreneur);

      if (statusDto.status === EntrepreneurStatus.APPROVED) {
        const entrepreneurRole = await queryRunner.manager.findOne(Role, {
          where: { name: 'entrepreneur' }
        });

        if (!entrepreneurRole) {
          throw new NotFoundException('Rol entrepreneur no encontrado');
        }

        const existingPerson = await queryRunner.manager.findOne(Person, {
          where: { id_person: entrepreneur.person.id_person },
          relations: ['user', 'user.roles']
        });

        if (existingPerson?.user) {
          const user = existingPerson.user;
          if (!user.roles.some(r => r.name === 'entrepreneur')) {
            user.roles.push(entrepreneurRole);
            await queryRunner.manager.save(user);

            if (!user.status || !user.isEmailVerified) {
              await queryRunner.manager.update(Person, entrepreneur.person.id_person, {
                user: {
                  ...user,
                  status: true,
                  isEmailVerified: true
                }
              });
            }
          }
        } else {
          await this.accountInvitationService.createUserAccount(
            entrepreneur.person.id_person,
            [entrepreneurRole.id_role],
            0,
            queryRunner
          );
        }
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
      const urls = [
        entrepreneur.entrepreneurship.url_1,
        entrepreneur.entrepreneurship.url_2, 
        entrepreneur.entrepreneurship.url_3
      ].filter(url => url && url !== null && url !== '');

      for (const url of urls) {
        if (typeof url === 'string') {
          const fileId = this.googleDriveService.extractFileIdFromUrl(url);
          if (fileId) {
            await this.googleDriveService.deleteFile(fileId);
          }
        }
      }
    }

      if (entrepreneur.person?.email) {
        try {
          await this.entrepreneurNotificationService.sendEntrepreneurRejectionEmail(entrepreneur);
        } catch (emailError) {
          console.error('Error enviando email:', emailError);
        }
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
