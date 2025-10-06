import { CreateProjectDto } from "../dto/createProject.dto";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { ToggleActiveDto } from "../dto/UdpateActive.dto";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { Activity } from "../entities/activity.entity";
import { Project } from "../entities/project.entity";


export interface IProjectService {
  createProject(createprojectDto: CreateProjectDto, images?: Express.Multer.File[]): Promise<Project>;
  updateProject(id_project: number,
    updateProjectDto: UpdateProjectDto, images?: Express.Multer.File[]): Promise<Project>;
  getMetricByProject(id_project: number);
  getbyIdProject(id_project: number): Promise<Project>
  getAllProject();
  statusProject(id_project: number, projectStatusDto: ProjectStatusDto);
  toggleActive(id: number, toggleDto: ToggleActiveDto): Promise<Project>;
  getActivitiesByProject(id_project: number): Promise<Activity[]>;
}



