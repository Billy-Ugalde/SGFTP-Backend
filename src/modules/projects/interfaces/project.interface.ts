import { ProjectStatusDto } from "../dto/project.dto";
import { Project } from "../entities/project.entity";


export interface IProjectService {
  //createProject();
  //updateProject();
  getbyIdProject(id__project: number): Promise<Project>
  getAllProject();
  statusProject(id_project:number,projectStatusDto: ProjectStatusDto);
}



