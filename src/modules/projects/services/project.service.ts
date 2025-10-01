import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ProjectStatus } from "../enums/project.enum";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { GoogleDriveService } from "src/modules/google-drive/google-drive.service";

@Injectable()
export class ProjectService implements IProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
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
        Metrics: createprojectDto.Metrics,
        Metric_value: 0,
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

      if (updateProjectDto.Name) updateData.Name = updateProjectDto.Name;
      if (updateProjectDto.Description) updateData.Description = updateProjectDto.Description;
      if (updateProjectDto.Observations) updateData.Observations = updateProjectDto.Observations;
      if (updateProjectDto.Aim) updateData.Aim = updateProjectDto.Aim;
      if (updateProjectDto.Start_date) updateData.Start_date = updateProjectDto.Start_date;
      if (updateProjectDto.End_date) updateData.End_date = updateProjectDto.End_date;
      if (updateProjectDto.Target_population) updateData.Target_population = updateProjectDto.Target_population;
      if (updateProjectDto.Location) updateData.Location = updateProjectDto.Location;
      if (updateProjectDto.Active !== undefined) updateData.Active = updateProjectDto.Active;
      if (updateProjectDto.Metrics) updateData.Metrics = updateProjectDto.Metrics;
      if (updateProjectDto.Metric_value !== undefined) updateData.Metric_value = updateProjectDto.Metric_value;


      if (images && images.length > 0) {
        console.log(`📁 Procesando ${images.length} imágenes para actualización`);

        const folderName = `project_${id_project}`;
        const fileMapping: { [key: string]: Express.Multer.File } = {};
        let fileIndex = 0;


        for (const field of ['url_1', 'url_2', 'url_3'] as const) {
          const fieldValue = updateProjectDto[field];

          if (typeof fieldValue === 'string' && fieldValue.startsWith('__FILE_REPLACE_')) {
            if (fileIndex < images.length) {
              fileMapping[field] = images[fileIndex];
              console.log(`🔄 Campo ${field} marcado para reemplazo`);
              fileIndex++;
            } else {
              console.warn(`⚠️ No hay suficientes archivos para ${field}`);
            }
          }
        }


        for (const [field, file] of Object.entries(fileMapping)) {
          const currentUrl = project[field as keyof Project];

          console.log(`🔄 Procesando ${field}`);


          if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
            const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
            if (fileId) {
              filesToDelete.push(fileId);
              console.log(`📝 Archivo anterior marcado para eliminación: ${fileId}`);
            }
          }


          try {
            console.log(`⬆️ Subiendo nuevo archivo...`);
            const { url } = await this.googleDriveService.uploadFile(file, folderName);
            switch (field) {
              case 'url_1':
                updateData.url_1 = url;
                break;
              case 'url_2':
                updateData.url_2 = url;
                break;
              case 'url_3':
                updateData.url_3 = url;
                break;
            }
            console.log(`✅ Nueva URL: ${url}`);
          } catch (uploadError) {
            throw new InternalServerErrorException(
              `Error subiendo imagen ${field}: ${uploadError.message}`
            );
          }
        }
      }


      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Project, id_project, updateData);
      }

      await queryRunner.commitTransaction();
      console.log('✅ Transacción confirmada');


      if (filesToDelete.length > 0) {
        console.log(`🗑️ Eliminando ${filesToDelete.length} archivos antiguos`);

        Promise.all(
          filesToDelete.map(async (fileId) => {
            try {
              await this.googleDriveService.deleteFile(fileId);
              console.log(`✅ Archivo ${fileId} eliminado`);
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

  async getMetricByProject(id_project: number) {
    const project = await this.projectRepository.findOne({ where: { Id_project: id_project } });

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id_project} no fue encontrado`);
    }
    return {
      metric: project.Metrics,
      metric_value: project.Metric_value
    };
  }

  async getAllProject() {
    return await this.projectRepository.find({
      relations: ['activity']
    });
  }

  async statusProject(id_project: number, projectStatus: ProjectStatusDto) {

    const project = await this.projectRepository.findOne({
      where: { Id_project: id_project }
    });

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id_project} no fue encontrado`);
    }
    await this.projectRepository.update(id_project, { Status: projectStatus.Status });

    const updatedProject = await this.projectRepository.findOne({
      where: { Id_project: id_project }
    });

    if (!updatedProject) {
      throw new NotFoundException(`No se pudo actualizar el estado del proyecto `);
    }
    return updatedProject;
  }
}