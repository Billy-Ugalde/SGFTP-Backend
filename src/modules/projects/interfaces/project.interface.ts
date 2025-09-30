import { QueryRunner } from "typeorm";
import { CreateProjectDto } from "../dto/createProject.dto";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { Project } from "../entities/project.entity";


export interface IProjectService {
  createProject(createprojectDto: CreateProjectDto): Promise<Project>;
  updateProject(id_project: number,
    updateProjectDto: UpdateProjectDto,
    queryRunner: QueryRunner): Promise<Project>;
  getMetricByProject(id_project: number);
  getbyIdProject(id_project: number): Promise<Project>
  getAllProject();
  statusProject(id_project: number, projectStatusDto: ProjectStatusDto);
}



