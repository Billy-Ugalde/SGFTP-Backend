import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ProjectService } from "../services/project.service";
import { Project } from "../entities/project.entity";
import { Activity } from "../entities/activity.entity"
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ToggleActiveDto } from "../dto/UdpateActive.dto";

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

    @Get(':id/activities')
    async getActivitiesByProject(
        @Param('id', ParseIntPipe) id_project: number
    ): Promise<Activity[]> {
        return await this.projectservice.getActivitiesByProject(id_project);
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


    @Patch('active/:id')
    async statusActive(
        @Param('id', ParseIntPipe) id: number,
        @Body() projectStatusActive: ToggleActiveDto
    ): Promise<Project> {
        return await this.projectservice.toggleActive(id, projectStatusActive);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FilesInterceptor('images', 6)) // Máximo 5 imágenes
    async createProject(
        @Body() createProjectDto: CreateProjectDto,
        @UploadedFiles() images: Express.Multer.File[]
    ): Promise<Project> {
        return await this.projectservice.createProject(createProjectDto, images);
    }

    @Put(':id')
    @UseInterceptors(FilesInterceptor('images', 6))
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProject: UpdateProjectDto,
        @UploadedFiles() images?: Express.Multer.File[]
    ): Promise<Project> {
        return await this.projectservice.updateProject(id, updateProject, images);
    }
}