import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";


@Injectable()
export class ProjectService implements IProjectService {
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

  statusProject() {

    
   }

}