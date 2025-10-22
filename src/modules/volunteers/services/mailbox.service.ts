import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Logger } from "@nestjs/common";
import { Mailbox } from "../entities/mailbox.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, QueryFailedError } from "typeorm";
import { IMailboxService, MailboxFiles } from "../interfaces/mailbox.interface";
import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";
import { GoogleDriveService } from "src/modules/google-drive/google-drive.service";
import { Volunteer } from "../entities/volunteer.entity"


@Injectable()
export class MailboxService implements IMailboxService {
    private readonly logger = new Logger(MailboxService.name);

    constructor(
    @InjectRepository(Mailbox)
    private mailboxRepository: Repository<Mailbox>,
    private dataSource: DataSource,
    private googleDriveService: GoogleDriveService,
  ) { }

  async createMailbox(
    createMailboxDto: CreateMailboxDto,
    documents?: Express.Multer.File[]
  ): Promise<Mailbox> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar si ya existe un mailbox con el mismo asunto
      const existingMailbox = await queryRunner.manager.findOne(Mailbox, {
        where: { Affair: createMailboxDto.Affair }
      });

      if (existingMailbox) {
        throw new ConflictException(
          'Ya existe un mensaje con el mismo asunto. Por favor, verifica los datos e intenta nuevamente.'
        );
      }

      // Verificar que el voluntario existe
      const volunteer = await queryRunner.manager.findOne(Volunteer, {
        where: { id_volunteer: createMailboxDto.Id_volunteer }
      });

      if (!volunteer) {
        throw new NotFoundException(
          `Voluntario con ID ${createMailboxDto.Id_volunteer} no fue encontrado`
        );
      }

      // Crear el mailbox
      const newMailbox = queryRunner.manager.create(Mailbox, {
        Organization: createMailboxDto.Organization,
        Description: createMailboxDto.Description,
        Affair: createMailboxDto.Affair,
        Hour_volunteer: createMailboxDto.Hour_volunteer || 0,
        volunteer: volunteer
      });

      const savedMailbox = await queryRunner.manager.save(Mailbox, newMailbox);

      // Subir documentos si existen
      if (documents && documents.length > 0) {
        const folderName = `mailbox_${savedMailbox.Id_mailbox}`;
        const urls: string[] = [];

        // Subir cada documento al Drive
        for (const document of documents) {
          const { url } = await this.googleDriveService.uploadFile(document, folderName);
          urls.push(url);
        }

        // Asignar las URLs (hasta 3 documentos)
        await queryRunner.manager.update(Mailbox, savedMailbox.Id_mailbox, {
          Document1: urls[0] || undefined,
          Document2: urls[1] || undefined,
          Document3: urls[2] || undefined
        });
      }

      await queryRunner.commitTransaction();
      return await this.getMailboxById(savedMailbox.Id_mailbox);

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        if (error.message.includes('Duplicate entry')) {
          throw new ConflictException(
            'Ya existe un mensaje con el mismo asunto y fecha de registro. Por favor, verifica los datos e intenta nuevamente.'
          );
        }
      }

      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error al crear el buzón de correo: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Error al crear el buzón de correo: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateMailbox(
    id_mailbox: number,
    updateMailboxDto: UpdateMailboxDto,
    files?: MailboxFiles
  ): Promise<Mailbox> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const mailbox = await this.getMailboxById(id_mailbox);
      const filesToDelete: string[] = [];
      const updateData: Partial<Mailbox> = {};

      // Actualizar campos básicos
      if (updateMailboxDto.Organization) updateData.Organization = updateMailboxDto.Organization;
      if (updateMailboxDto.Description) updateData.Description = updateMailboxDto.Description;
      if (updateMailboxDto.Affair) updateData.Affair = updateMailboxDto.Affair;
      if (updateMailboxDto.Hour_volunteer !== undefined) updateData.Hour_volunteer = updateMailboxDto.Hour_volunteer;

      // Procesar documentos con acciones específicas
      const documentFields = ['Document1', 'Document2', 'Document3'] as const;
      const folderName = `mailbox_${id_mailbox}`;

      // Función para obtener archivo específico por campo
      const getFileForField = (fieldName: string): Express.Multer.File | undefined => {
        if (!files) return undefined;

        // Buscar en field names específicos (Document1_file, Document2_file, etc.)
        const specificField = `${fieldName}_file` as keyof typeof files;
        const fileArray = files[specificField];

        if (fileArray && fileArray.length > 0) {
          return fileArray[0];
        }

        // Fallback: buscar en el array 'documents' por orden
        if (files.documents && files.documents.length > 0) {
          const index = documentFields.indexOf(fieldName as any);
          if (index >= 0 && index < files.documents.length) {
            return files.documents[index];
          }
        }

        return undefined;
      };

      // Procesar cada campo de documento
      for (const field of documentFields) {
        const actionField = `${field}_action` as keyof UpdateMailboxDto;
        const action = updateMailboxDto[actionField] as string;
        const currentUrl = mailbox[field];

        switch (action) {
          case 'keep':
            // Mantener la URL existente
            if (currentUrl) {
              updateData[field] = currentUrl;
            }
            break;

          case 'replace':
            // Obtener archivo específico para este campo
            const replaceFile = getFileForField(field);

            if (replaceFile) {
              // Marcar documento anterior para eliminación
              if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
                const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
                if (fileId) {
                  filesToDelete.push(fileId);
                }
              }

              // Subir nuevo documento
              try {
                const { url } = await this.googleDriveService.uploadFile(replaceFile, folderName);
                updateData[field] = url;
              } catch (uploadError) {
                this.logger.error(`Error al subir documento ${field} a Google Drive: ${uploadError.message}`, uploadError.stack);
                throw new InternalServerErrorException(
                  `Error al subir documento ${field}: ${uploadError.message}`
                );
              }
            } else {
              // Si no hay archivo nuevo pero la acción es replace, mantener el actual
              if (currentUrl) {
                updateData[field] = currentUrl;
              }
            }
            break;

          case 'delete':
            // Eliminar documento
            if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
              const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
              if (fileId) {
                filesToDelete.push(fileId);
              }
            }
            // Establecer campo como undefined para eliminarlo
            updateData[field] = '';
            break;

          case 'add':
            // Obtener archivo específico para este campo
            const addFile = getFileForField(field);

            if (addFile) {
              try {
                const { url } = await this.googleDriveService.uploadFile(addFile, folderName);
                updateData[field] = url;
              } catch (uploadError) {
                this.logger.error(`Error al agregar documento ${field} a Google Drive: ${uploadError.message}`, uploadError.stack);
                throw new InternalServerErrorException(
                  `Error al agregar documento ${field}: ${uploadError.message}`
                );
              }
            }
            break;

          default:
            // Sin acción definida: mantener el valor actual
            if (currentUrl) {
              updateData[field] = currentUrl;
            }
            break;
        }
      }

      // Aplicar actualización
      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Mailbox, id_mailbox, updateData);
      }

      await queryRunner.commitTransaction();

      // Eliminar archivos antiguos (después del commit)
      if (filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map(async (fileId) => {
            try {
              await this.googleDriveService.deleteFile(fileId);
            } catch (deleteError) {
              this.logger.error(`No se pudo eliminar archivo ${fileId} de Google Drive`, deleteError.stack);
            }
          })
        );
      }

      return await this.getMailboxById(id_mailbox);

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof InternalServerErrorException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error al actualizar el buzón de correo: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Error al actualizar el buzón de correo: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getMailboxById(id_mailbox: number): Promise<Mailbox> {
    const mailbox = await this.mailboxRepository.findOne({
      where: { Id_mailbox: id_mailbox },
      relations: ['volunteer']
    });

    if (!mailbox) {
      throw new NotFoundException(`El mensaje de intención de voluntariado con ID ${id_mailbox} no fue encontrado`);
    }

    return mailbox;
  }

  async getAllMailbox(): Promise<Mailbox[]> {
    return await this.mailboxRepository.find({
      relations: ['volunteer'],
      order: {
        Registration_date: 'ASC'
      }
    });
  }
}