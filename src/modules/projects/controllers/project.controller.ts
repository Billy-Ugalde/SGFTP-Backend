import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ProjectService } from "../services/project.service";
import { Project } from "../entities/project.entity";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";

@Controller('projects')
export class ProjectController {
    constructor(private projectservice: ProjectService) { }

    @Get()
    async getall(): Promise<Project[]> {
        return await this.projectservice.getAllProject();
    }

    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id_project: number): Promise<Project> {
        return await this.projectservice.getbyIdProject(id_project)
    }

    @Patch(':id')
    async statusProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() projectStatus: ProjectStatusDto
    ): Promise<Project> {
        return await this.projectservice.statusProject(id, projectStatus);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body()
        createProject: CreateProjectDto): Promise<Project> {
        return await this.projectservice.createProject(createProject);
    }
}