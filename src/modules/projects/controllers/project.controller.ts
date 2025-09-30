import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put } from "@nestjs/common";
import { ProjectService } from "../services/project.service";
import { Project } from "../entities/project.entity";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { UpdateProjectDto } from "../dto/updateProject.dto";

@Controller('projects')
export class ProjectController {
    constructor(private projectservice: ProjectService) { }

    @Get()
    async getAllProject(): Promise<Project[]> {
        return await this.projectservice.getAllProject();
    }

    @Get(':id')
    async getbyIdProject(@Param('id', ParseIntPipe) id_project: number): Promise<Project> {
        return await this.projectservice.getbyIdProject(id_project)
    }

    @Get('metric/:id')
    async getMetricByProject(@Param('id', ParseIntPipe) id_project: number) {
        return await this.projectservice.getMetricByProject(id_project)
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
    async createProject(
        @Body()
        createProject: CreateProjectDto): Promise<Project> {
        return await this.projectservice.createProject(createProject);
    }

    @Put(':id')
    async updateProject(@Param('id', ParseIntPipe) id: number, @Body() updateProject: UpdateProjectDto): Promise<Project> {
        return await this.projectservice.updateProject(id, updateProject);
    }
}