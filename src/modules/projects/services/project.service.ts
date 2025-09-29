import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";
import { ProjectStatusDto } from "../dto/project.dto";


@Injectable()
export class ProjectService implements IProjectService {
  updateStatus: any;
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) { }

  createProject() { }
  updateProject() { }

  async getbyIdProject(id_project: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { Id_project: id_project } });

    if (!project) {
      throw `El proyecto con el id ${id_project} no fue encontrado`;
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
      throw `El proyecto con el id ${id_project} no fue encontrado`;
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