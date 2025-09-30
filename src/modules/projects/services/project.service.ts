import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ProjectStatus } from "../enums/project.enum";
import { UpdateProjectDto } from "../dto/updateProject.dto";

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

  async updateProject(
    id_project: number,
    updateProjectDto: UpdateProjectDto
  ): Promise<Project> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Project, id_project, updateData);
      }

      const project = await queryRunner.manager.findOne(Project, {
        where: { Id_project: id_project }
      });

      if (!project) {
        throw new NotFoundException(`Proyecto con id ${id_project} no encontrado`);
      }

      await queryRunner.commitTransaction();
      return project;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;

    } finally {
      await queryRunner.release();
    }
  }

  async getbyIdProject(id_project: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { Id_project: id_project } });

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