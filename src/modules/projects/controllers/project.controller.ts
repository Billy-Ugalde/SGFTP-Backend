import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
  UseGuards
} from "@nestjs/common";
import { FileFieldsInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ProjectService } from "../services/project.service";
import { Project } from "../entities/project.entity";
import { Activity } from "../entities/activity.entity";
import { ProjectStatusDto } from "../dto/projectStatus.dto";
import { CreateProjectDto } from "../dto/createProject.dto";
import { UpdateProjectDto } from "../dto/updateProject.dto";
import { ToggleActiveDto } from "../dto/UdpateActive.dto";
import { ProjectFiles } from "../interfaces/project.interface";
import { AuthGuard } from "../../auth/guards/auth.guard";
import { RoleGuard } from "../../auth/guards/role.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../auth/enums/user-role.enum";
import { Public } from "src/modules/auth/decorators/public.decorator";

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectController {
    constructor(private projectservice: ProjectService) { }

    @Get()
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getAllProject(): Promise<Project[]> {
        return await this.projectservice.getAllProject();
    }

    @Get('public/active')
    @Public()
    async getActivePublicProjects(): Promise<Project[]> {
        return await this.projectservice.getActivePublicProjects();
    }

    @Get('slug/:slug')
    @Public()
    async getProjectBySlug(@Param('slug') slug: string): Promise<Project> {
        return await this.projectservice.getProjectBySlug(slug);
    }

    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getbyIdProject(@Param('id', ParseIntPipe) id_project: number): Promise<Project> {
        return await this.projectservice.getbyIdProject(id_project)
    }

    @Get(':id/activities')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getActivitiesByProject(
        @Param('id', ParseIntPipe) id_project: number
    ): Promise<Activity[]> {
        return await this.projectservice.getActivitiesByProject(id_project);
    }

    @Get('metric/:id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getMetricByProject(@Param('id', ParseIntPipe) id_project: number) {
        return await this.projectservice.getMetricByProject(id_project)
    }

    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    async statusProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() projectStatus: ProjectStatusDto
    ): Promise<Project> {
        return await this.projectservice.statusProject(id, projectStatus);
    }


    @Patch('active/:id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    async statusActive(
        @Param('id', ParseIntPipe) id: number,
        @Body() projectStatusActive: ToggleActiveDto
    ): Promise<Project> {
        return await this.projectservice.toggleActive(id, projectStatusActive);
    }

    @Post()
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FilesInterceptor('images', 6, { limits: { fileSize: 10 * 1024 * 1024 } }))
    async createProject(
        @Body() createProjectDto: CreateProjectDto,
        @UploadedFiles() images: Express.Multer.File[]
    ): Promise<Project> {
        return await this.projectservice.createProject(createProjectDto, images);
    }

    @Put(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'url_1_file', maxCount: 1 },
        { name: 'url_2_file', maxCount: 1 },
        { name: 'url_3_file', maxCount: 1 },
        { name: 'url_4_file', maxCount: 1 },
        { name: 'url_5_file', maxCount: 1 },
        { name: 'url_6_file', maxCount: 1 },
        { name: 'images', maxCount: 6 }
    ], { limits: { fileSize: 10 * 1024 * 1024 } }))
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProject: UpdateProjectDto,
        @UploadedFiles() files?: ProjectFiles
    ): Promise<Project> {
        return await this.projectservice.updateProject(id, updateProject, files);
    }
}