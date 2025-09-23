import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { Repository } from "typeorm";
import { IProjectService } from "../interfaces/project.interface";


@Injectable()
export class ProjectService implements IProjectService {
  constructor(
    @InjectRepository(Project)
    private fairRepository: Repository<Project>,
  ) { }

  createProject() { }
  updateProject() { }
  getbyIdProject() { }
  getAllProject() { }
  statusProject() { }

}