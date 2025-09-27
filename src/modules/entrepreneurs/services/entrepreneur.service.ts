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

// ============ NUEVO: import requerido para la validación de permisos ============
import { ForbiddenException } from '@nestjs/common';
// ===================== FIN NUEVO =====================

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


  async create(createDto: CreateCompleteEntrepreneurDto, request?: any, files?: Express.Multer.File[],): Promise<Entrepreneur> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const savedPerson = await this.personService.create(createDto.person, queryRunner);

      // Determinar estado inicial basado en si hay usuario autenticado y sus roles
      let initialStatus = EntrepreneurStatus.PENDING;
      let createdEntrepreneur: Entrepreneur;

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

      createdEntrepreneur = await queryRunner.manager.save(Entrepreneur, entrepreneur);

      // 🚀 Subir archivos a Drive
      let urls: string[] = [];
      let folderId: string | null = null;

      if (files && files.length > 0) {
        const folderName = `entrepreneur_${createdEntrepreneur.id_entrepreneur}`;
        for (const file of files) {
          const { url, folderId: fId } = await this.googleDriveService.uploadFile(file, folderName);
          urls.push(url);
          folderId = fId; // el mismo para todos los archivos
        }
      }

      // Crear emprendimiento con URLs y opcionalmente folderId
      await this.entrepreneurshipService.create(
        createdEntrepreneur.id_entrepreneur,
        {
          ...createDto.entrepreneurship,
          url_1: urls[0] || undefined,
          url_2: urls[1] || undefined,
          url_3: urls[2] || undefined,
          // folder_id: folderId, // 👈 si agregas esta columna en tu entidad
        },
        queryRunner,
      );

      // Crear usuario con rol emprendedor si el estado inicial es aprobado, es decir si un administrador fue el que creo el emprendedor
      if (initialStatus === EntrepreneurStatus.APPROVED) {
        const entrepreneurRole = await queryRunner.manager.findOne(Role, { where: { name: 'entrepreneur' } });

        if (!entrepreneurRole) {
          throw new NotFoundException('Rol entrepreneur no encontrado');
        }

        await this.accountInvitationService.createUserAccount(
          savedPerson.id_person,
          [entrepreneurRole.id_role],
          request?.user?.id ?? 0,
          queryRunner
        );
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

     // Procesar actualización del emprendimiento
    let entrepreneurshipUpdateData = { ...updateDto.entrepreneurship };
    
    // Manejar archivos si se enviaron
    if (files && files.length > 0 && entrepreneurshipUpdateData) {
      console.log(`📁 Procesando ${files.length} archivos para actualización`);
      
      const folderName = `entrepreneur_${entrepreneur.id_entrepreneur}`;
      
      // Mapear archivos a sus campos correspondientes
      const fileMapping: { [key: string]: Express.Multer.File } = {};
      let fileIndex = 0;
      
      // Identificar qué campos necesitan ser reemplazados basándose en los marcadores
      for (const field of ['url_1', 'url_2', 'url_3'] as const) {
        const fieldValue = entrepreneurshipUpdateData[field];
        
        // Verificar si este campo tiene un marcador de reemplazo
        if (typeof fieldValue === 'string' && fieldValue.startsWith('__FILE_REPLACE_')) {
          if (fileIndex < files.length) {
            fileMapping[field] = files[fileIndex];
            console.log(`🔄 Campo ${field} marcado para reemplazo con archivo ${fileIndex}`);
            fileIndex++;
          } else {
            console.warn(`⚠️ No hay suficientes archivos para reemplazar ${field}`);
            delete entrepreneurshipUpdateData[field];
          }
        }
      }
      
      // Procesar cada reemplazo de archivo
      for (const [field, file] of Object.entries(fileMapping)) {
        const currentUrl = entrepreneur.entrepreneurship?.[field as keyof Entrepreneurship];
        
        console.log(`🔄 Procesando reemplazo para ${field}`);
        console.log(`   - URL actual: ${currentUrl || 'ninguna'}`);
        console.log(`   - Nuevo archivo: ${file.originalname} (${file.size} bytes)`);
        
        // 1. Marcar archivo anterior para eliminación si existe
        if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
          const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
          if (fileId) {
            filesToDelete.push(fileId);
            console.log(`   📝 Archivo anterior marcado para eliminación: ${fileId}`);
          } else {
            console.warn(`   ⚠️ No se pudo extraer ID del archivo anterior: ${currentUrl}`);
          }
        }
        
        // 2. Subir nuevo archivo
        try {
          console.log(`   ⬆️ Subiendo nuevo archivo a Google Drive...`);
          const { url, folderId } = await this.googleDriveService.uploadFile(file, folderName);
          
          // Asignar la nueva URL al campo correspondiente
          if (field === 'url_1' || field === 'url_2' || field === 'url_3') {
             entrepreneurshipUpdateData[field] = url;
          }
          
          console.log(`   ✅ Archivo subido exitosamente`);
          console.log(`   - Nueva URL: ${url}`);
          console.log(`   - Folder ID: ${folderId}`);
          
        } catch (uploadError) {
          console.error(`   ❌ Error subiendo archivo para ${field}:`, uploadError);
          
          // Rollback y lanzar error detallado
          throw new InternalServerErrorException(
            `Error subiendo imagen ${field}: ${uploadError.message || 'Error desconocido'}`
          );
        }
      }
      
      // Limpiar marcadores no procesados (por si quedó alguno)
      for (const field of ['url_1', 'url_2', 'url_3'] as const) {
        const value = entrepreneurshipUpdateData[field];
        if (typeof value === 'string' && value.startsWith('__FILE_REPLACE_')) {
          console.log(`🧹 Limpiando marcador no procesado: ${field}`);
          delete entrepreneurshipUpdateData[field];
        }
      }
    }
    
    // Actualizar datos del emprendimiento si hay cambios
    if (entrepreneurshipUpdateData && Object.keys(entrepreneurshipUpdateData).length > 0) {
      console.log('💾 Actualizando datos del emprendimiento:', entrepreneurshipUpdateData);
      
      await this.entrepreneurshipService.update(
        entrepreneur.entrepreneurship.id_entrepreneurship,
        entrepreneurshipUpdateData,
        queryRunner
      );
    }
    
    // Confirmar transacción
    await queryRunner.commitTransaction();
    console.log('✅ Transacción confirmada exitosamente');
    
    // Eliminar archivos antiguos DESPUÉS del commit exitoso
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Iniciando eliminación de ${filesToDelete.length} archivos antiguos`);
      
      // Eliminar archivos de forma asíncrona sin bloquear la respuesta
      Promise.all(
        filesToDelete.map(async (fileId) => {
          try {
            await this.googleDriveService.deleteFile(fileId);
            console.log(`   ✅ Archivo ${fileId} eliminado`);
          } catch (deleteError) {
            // No fallar si la eliminación falla, solo loguear
            console.error(`   ⚠️ No se pudo eliminar archivo ${fileId}:`, deleteError.message);
          }
        })
      ).then(() => {
        console.log('🗑️ Proceso de eliminación completado');
      }).catch(error => {
        console.error('⚠️ Error en proceso de eliminación:', error);
      });
    }

    // Retornar el emprendedor actualizado con todas sus relaciones
    const updatedEntrepreneur = await this.findOne(id);
    console.log('✅ Emprendedor actualizado exitosamente:', {
      id: updatedEntrepreneur.id_entrepreneur,
      name: updatedEntrepreneur.entrepreneurship?.name,
      urls: {
        url_1: updatedEntrepreneur.entrepreneurship?.url_1,
        url_2: updatedEntrepreneur.entrepreneurship?.url_2,
        url_3: updatedEntrepreneur.entrepreneurship?.url_3,
      }
    });
    
    return updatedEntrepreneur;
    
  } catch (error) {
    // Rollback en caso de error
    await queryRunner.rollbackTransaction();
    
    console.error('❌ Error en transacción de actualización:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Re-lanzar el error con más contexto si es necesario
    if (error instanceof InternalServerErrorException) {
      throw error;
    }
    
    // Para otros errores, agregar contexto
    throw new InternalServerErrorException(
      `Error actualizando emprendedor: ${error.message || 'Error desconocido'}`
    );
    
  } finally {
    // Siempre liberar el queryRunner
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
