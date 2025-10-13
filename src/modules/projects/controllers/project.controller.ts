import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ProjectService } from "../services/project.service";
import { Project } from "../entities/project.entity";
import { Activity } from "../entities/activity.entity"
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { FileFieldsInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ToggleActiveDto } from "../dto/UdpateActive.dto";
import { ProjectFiles } from "../interfaces/project.interface";

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
    @UseInterceptors(FilesInterceptor('images', 6)) 
    async createProject(
        @Body() createProjectDto: CreateProjectDto,
        @UploadedFiles() images: Express.Multer.File[]
    ): Promise<Project> {
        return await this.projectservice.createProject(createProjectDto, images);
    }
    @Put(':id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'url_1_file', maxCount: 1 },
        { name: 'url_2_file', maxCount: 1 },
        { name: 'url_3_file', maxCount: 1 },
        { name: 'url_4_file', maxCount: 1 },
        { name: 'url_5_file', maxCount: 1 },
        { name: 'url_6_file', maxCount: 1 },
        { name: 'images', maxCount: 6 }
    ]))
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProject: UpdateProjectDto,
        @UploadedFiles() files?: ProjectFiles
    ): Promise<Project> {
        return await this.projectservice.updateProject(id, updateProject, files);
    }
}