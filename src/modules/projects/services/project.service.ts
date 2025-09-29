import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ProjectStatus } from "../enums/project.enum";
import { register } from "module";

@Injectable()
export class ProjectService implements IProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private dataSource: DataSource,
  ) { }

  async createProject(createprojectDto: CreateProjectDto): Promise<Project> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingProject = await queryRunner.manager.findOne(Project, {
        where: {
          Name: createprojectDto.Name
        }
      });

      if (existingProject) {
        throw new ConflictException(
          'Ya existe una proyecto con el mismo nombre y fecha. Por favor, verifica los datos e intenta nuevamente.',
        );
      }

      const newproject = queryRunner.manager.create(Project, {
        ...createprojectDto,
        Active: false,
        Status: ProjectStatus.PENDING
      });

      const savedproject = await queryRunner.manager.save(Project, newproject);


      await queryRunner.commitTransaction();

      return savedproject;

    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof QueryFailedError) {
        if (error.message.includes('Duplicate entry')) {
          throw new ConflictException(
            'Ya existe un proyecto con el mismo nombre y fecha. Por favor, verifica los datos e intenta nuevamente.',
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

  updateProject() { }  //pendiente de hacer

  async getbyIdProject(id_project: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { Id_project: id_project } });

    if (!project) {
      throw new NotFoundException(`El proyecto con ID ${id_project} no fue encontrado`);
    }
    return project;
  }

  async getAllProject() {
    return await this.projectRepository.find();
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