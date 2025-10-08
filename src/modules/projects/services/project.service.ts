import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { Activity } from "../entities/activity.entity";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ProjectStatus } from "../enums/project.enum";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { GoogleDriveService } from "src/modules/google-drive/google-drive.service";
import { ToggleActiveDto } from "../dto/UdpateActive.dto";

@Injectable()
export class ProjectService implements IProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    private dataSource: DataSource,
    private googleDriveService: GoogleDriveService,
  ) { }

  async createProject(
    createprojectDto: CreateProjectDto,
    images?: Express.Multer.File[]
  ): Promise<Project> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingProject = await queryRunner.manager.findOne(Project, {
        where: { Name: createprojectDto.Name }
      });

      if (existingProject) {
        throw new ConflictException(
          'Ya existe un proyecto con el mismo nombre. Por favor, verifica los datos e intenta nuevamente.',
        );
      }

      const newproject = queryRunner.manager.create(Project, {
        Name: createprojectDto.Name,
        Description: createprojectDto.Description,
        Observations: createprojectDto.Observations,
        Aim: createprojectDto.Aim,
        Start_date: createprojectDto.Start_date,
        End_date: createprojectDto.End_date,
        Target_population: createprojectDto.Target_population,
        Location: createprojectDto.Location,
        METRIC_TOTAL_BENEFICIATED: 0,
        METRIC_TOTAL_WASTE_COLLECTED: 0,
        METRIC_TOTAL_TREES_PLANTED: 0,
        Active: false,
        Status: ProjectStatus.PENDING
      });

      const savedproject = await queryRunner.manager.save(Project, newproject);

      // 🚀 Subir imágenes a Drive
      let urls: string[] = [];

      if (images && images.length > 0) { // ← Cambiar a "images"
        const folderName = `project_${savedproject.Id_project}`;
        for (const image of images) { // ← Cambiar a "image"
          const { url } = await this.googleDriveService.uploadFile(image, folderName);
          urls.push(url);
        }


        await queryRunner.manager.update(Project, savedproject.Id_project, {
          url_1: urls[0] || undefined,
          url_2: urls[1] || undefined,
          url_3: urls[2] || undefined,
          url_4: urls[3] || undefined,
          url_5: urls[4] || undefined,
          url_6: urls[5] || undefined,
        });
      }

      await queryRunner.commitTransaction();
      return await this.getbyIdProject(savedproject.Id_project);

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        if (error.message.includes('Duplicate entry')) {
          throw new ConflictException(
            'Ya existe un proyecto con el mismo nombre. Por favor, verifica los datos e intenta nuevamente.',
          );
        }
      }
      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error interno del servidor al crear el proyecto',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateProject(
  id_project: number,
  updateProjectDto: UpdateProjectDto,
  images?: Express.Multer.File[]
): Promise<Project> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const project = await this.getbyIdProject(id_project);
    const filesToDelete: string[] = [];
    const updateData: Partial<Project> = {};

    // 1. Actualizar campos básicos
    if (updateProjectDto.Name) updateData.Name = updateProjectDto.Name;
    if (updateProjectDto.Description) updateData.Description = updateProjectDto.Description;
    if (updateProjectDto.Observations) updateData.Observations = updateProjectDto.Observations;
    if (updateProjectDto.Aim) updateData.Aim = updateProjectDto.Aim;
    if (updateProjectDto.Start_date) updateData.Start_date = updateProjectDto.Start_date;
    if (updateProjectDto.End_date) updateData.End_date = updateProjectDto.End_date;
    if (updateProjectDto.Target_population) updateData.Target_population = updateProjectDto.Target_population;
    if (updateProjectDto.Location) updateData.Location = updateProjectDto.Location;
    if (updateProjectDto.Active !== undefined) updateData.Active = updateProjectDto.Active;

    // 2. Procesar imágenes si existen
    if (images && images.length > 0) {
      console.log(`📁 Procesando ${images.length} imágenes para actualización`);

      const folderName = `project_${id_project}`;
      const imageFields = ['url_1', 'url_2', 'url_3', 'url_4', 'url_5', 'url_6'] as const;

      // Procesar cada imagen en orden
      for (let i = 0; i < images.length && i < imageFields.length; i++) {
        const field = imageFields[i];
        const file = images[i];
        const currentUrl = project[field];

        console.log(`🔄 Procesando ${field} con archivo: ${file.originalname}`);

        // Eliminar imagen anterior si existe
        if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
          const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
          if (fileId) {
            filesToDelete.push(fileId);
            console.log(`📝 Archivo anterior marcado para eliminación: ${fileId}`);
          }
        }

        try {
          console.log(`⬆️ Subiendo nuevo archivo para ${field}...`);
          const { url } = await this.googleDriveService.uploadFile(file, folderName);
          updateData[field] = url;
          console.log(`✅ Nueva URL para ${field}: ${url}`);
        } catch (uploadError) {
          console.error(`❌ Error subiendo imagen ${field}:`, uploadError);
          throw new InternalServerErrorException(
            `Error subiendo imagen ${field}: ${uploadError.message}`
          );
        }
      }

      // Para campos restantes sin imagen nueva, mantener los valores actuales
      for (let i = images.length; i < imageFields.length; i++) {
        const field = imageFields[i];
        if (project[field]) {
          updateData[field] = project[field];
        }
      }
    } else {
      // Si no hay imágenes nuevas, mantener todas las existentes
      const imageFields = ['url_1', 'url_2', 'url_3', 'url_4', 'url_5', 'url_6'] as const;
      imageFields.forEach(field => {
        if (project[field]) {
          updateData[field] = project[field];
        }
      });
    }

    // 3. Aplicar la actualización
    if (Object.keys(updateData).length > 0) {
      await queryRunner.manager.update(Project, id_project, updateData);
      console.log('✅ Campos actualizados en la base de datos');
    }

    await queryRunner.commitTransaction();
    console.log('✅ Transacción confirmada');

    // 4. Eliminar archivos antiguos (después del commit)
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Eliminando ${filesToDelete.length} archivos antiguos`);

      await Promise.all(
        filesToDelete.map(async (fileId) => {
          try {
            await this.googleDriveService.deleteFile(fileId);
            console.log(`✅ Archivo ${fileId} eliminado de Google Drive`);
          } catch (deleteError) {
            console.error(`⚠️ No se pudo eliminar ${fileId}:`, deleteError.message);
          }
        })
      );
    }

    return await this.getbyIdProject(id_project);

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error en actualización:', error.message);

    if (error instanceof InternalServerErrorException) {
      throw error;
    }

    throw new InternalServerErrorException(
      `Error actualizando proyecto: ${error.message}`
    );
  } finally {
    await queryRunner.release();
  }
}

  async getbyIdProject(id_project: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { Id_project: id_project, }, relations: ['activity'] });

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id_project} no fue encontrado`);
    }
    return project;
  }

  async getActivitiesByProject(id_project: number): Promise<Activity[]> {

    await this.getbyIdProject(id_project);

    return await this.activityRepository.find({
      where: {
        project: { Id_project: id_project }
      },
      relations: ['dateActivities'],
      order: {
        Registration_date: 'DESC'
      }
    });
  }

  async getMetricByProject(id_project: number) {
    const project = await this.getbyIdProject(id_project);

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id_project} no fue encontrado`);
    }

    return {
      METRIC_TOTAL_BENEFICIATED: project.METRIC_TOTAL_BENEFICIATED,
      TOTAL_WASTE_COLLECTED: project.METRIC_TOTAL_WASTE_COLLECTED,
      TOTAL_TREES_PLANTED: project.METRIC_TOTAL_TREES_PLANTED,
    };
  }

  async getAllProject() {
    return await this.projectRepository.find({
      relations: ['activity']
    });
  }

  async statusProject(id_project: number, projectStatus: ProjectStatusDto): Promise<Project> {
    const project = this.getbyIdProject(id_project);
    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id_project} no fue encontrado`);
    }
    await this.projectRepository.update(id_project, { Status: projectStatus.Status });
    return await this.getbyIdProject(id_project);
  }

  async toggleActive(id: number, toggleDto: ToggleActiveDto): Promise<Project> {
    const project = await this.getbyIdProject(id);
    project.Active = toggleDto.active;
    return await this.projectRepository.save(project); // Ya retorna el proyecto actualizado
  }
}